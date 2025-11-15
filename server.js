require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const ExplicitNLPProcessor = require('./explicit-nlp');
const { callRunPodServerless, checkRunPodHealth } = require('./runpod-client');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = process.env.GPT_MODEL || 'gpt-3.5-turbo';
const MAX_HISTORY_ITEMS = 100; // Maximum number of items to store in history

// RunPod Serverless configuration
const RUNPOD_ENDPOINT_URL = process.env.RUNPOD_ENDPOINT_URL || null;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || null;
const USE_RUNPOD = process.env.USE_RUNPOD === 'true' && RUNPOD_ENDPOINT_URL && RUNPOD_API_KEY;

// History storage
let conversationHistory = [];
const historyFilePath = path.join(__dirname, 'conversation_history.json');

// Initialize explicit NLP processor
const explicitNLP = new ExplicitNLPProcessor();

// Load existing history if available - Security: Safe JSON parsing
try {
  if (fs.existsSync(historyFilePath)) {
    const historyData = fs.readFileSync(historyFilePath, 'utf8');
    conversationHistory = safeJsonParse(historyData, []);
    if (Array.isArray(conversationHistory)) {
      console.log(`Loaded ${conversationHistory.length} conversation items from history`);
    } else {
      console.warn('[Security] Invalid history format, resetting');
      conversationHistory = [];
    }
  }
} catch (error) {
  console.error('Error loading conversation history:', error);
  conversationHistory = [];
}

// Function to save history to file
function saveHistoryToFile() {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(conversationHistory, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving conversation history:', error);
  }
}

// Security: Input sanitization helpers
function sanitizeString(str, maxLength = 10000) {
  if (typeof str !== 'string') return '';
  // Remove null bytes and control characters
  let sanitized = str.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

function sanitizeArray(arr, maxLength = 100) {
  if (!Array.isArray(arr)) return [];
  if (arr.length > maxLength) {
    return arr.slice(0, maxLength);
  }
  return arr.map(item => {
    if (typeof item === 'object' && item !== null) {
      return {
        role: sanitizeString(item.role || '', 20),
        content: sanitizeString(item.content || '', 5000)
      };
    }
    return item;
  });
}

// Security: Input validation helpers
function validateString(value, fieldName, maxLength = 10000) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  return value;
}

function validateArray(value, fieldName, maxLength = 100) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  return value;
}

function validateNumber(value, fieldName, min = -Infinity, max = Infinity) {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return value;
}

// Security: Safe JSON parsing with error handling
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[Security] JSON parse error:', error.message);
    return defaultValue;
  }
}

// Parse allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure CORS - Security: Restrict origins
app.use(cors({
  origin: function (origin, callback) {
    // In production, require explicit origin
    if (!isDevelopment && allowedOrigins.length === 0) {
      callback(new Error('CORS: No allowed origins configured for production'));
      return;
    }
    
    // Allow requests with no origin (like mobile apps, curl, etc.) - only in dev
    if (!origin) {
      if (isDevelopment) {
        callback(null, true);
        return;
      } else {
        callback(new Error('CORS: Origin required in production'));
        return;
      }
    }
    
    // If ALLOWED_ORIGINS contains '*', allow all (only in dev)
    if (allowedOrigins.includes('*')) {
      if (isDevelopment) {
        callback(null, true);
        return;
      } else {
        callback(new Error('CORS: Wildcard origin not allowed in production'));
        return;
      }
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Also allow localhost on any port for development only
    if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      callback(null, true);
      return;
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for generation endpoint (expensive operation)
const generationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 generations per minute per IP
  message: 'Too many generation requests. Please wait a moment before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(limiter);

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Serve static HTML files
app.get('/test-prompt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-prompt.html'));
});

app.get('/debug-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-test.html'));
});

app.get('/cors-debug.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'cors-debug.html'));
});

// Serve test-chat.html from nocturne-reply-forge directory
// Security: Path traversal protection
app.get('/test-chat.html', (req, res) => {
  // Security: Whitelist allowed files (prevent path traversal)
  const allowedFiles = ['test-chat.html'];
  const requestedFile = req.path.split('/').pop();
  
  if (!allowedFiles.includes(requestedFile)) {
    console.error('[Security] Attempted to access disallowed file:', requestedFile);
    res.status(403).send('Access denied');
    return;
  }
  
  // Try local file first (copied to gpt-relay-server)
  const localPath = path.join(__dirname, 'test-chat.html');
  const remotePath = path.join(__dirname, '..', 'nocturne-reply-forge', 'test-chat.html');
  
  // Security: Resolve paths and ensure they're within allowed directories
  const resolvedLocal = path.resolve(localPath);
  const resolvedRemote = path.resolve(remotePath);
  const allowedDir = path.resolve(__dirname);
  const allowedParentDir = path.resolve(__dirname, '..', 'nocturne-reply-forge');
  
  // Check if resolved path is within allowed directory
  if (!resolvedLocal.startsWith(allowedDir) && !resolvedRemote.startsWith(allowedParentDir)) {
    console.error('[Security] Path traversal attempt detected');
    res.status(403).send('Access denied');
    return;
  }
  
  // Check local first, then remote
  const testChatPath = fs.existsSync(localPath) ? localPath : remotePath;
  
  // Final security check: ensure file exists and is within allowed directory
  if (!fs.existsSync(testChatPath)) {
    console.error('[Server] test-chat.html not found');
    res.status(404).send('<html><body><h1>404 - File Not Found</h1></body></html>');
    return;
  }
  
  // Verify final path is safe
  const finalPath = path.resolve(testChatPath);
  if (!finalPath.startsWith(allowedDir) && !finalPath.startsWith(allowedParentDir)) {
    console.error('[Security] Invalid file path:', finalPath);
    res.status(403).send('Access denied');
    return;
  }
  
      res.sendFile(testChatPath, (err) => {
        if (err) {
          console.error('[Server] Error serving test-chat.html:', err.message);
          // Security: Don't expose file path or error details
          res.status(500).send('Error loading file');
        }
      });
});

// --- GPT RELAY SERVER ---
// This server relays requests from the userscript to the OpenAI API (or a mock endpoint).
// It handles CORS, API key management, and conversation history.

// JSONP support for the root endpoint
app.get('/', (req, res) => {
  const callback = req.query.callback;
  const responseText = 'GPT Relay Server is running';
  
  if (callback) {
    // If callback is provided, wrap the response in the callback function (JSONP)
    res.set('Content-Type', 'application/javascript');
    res.send(`${callback}("${responseText}")`);
  } else {
    // Regular response
    res.send(responseText);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ollama: 'configured',
      openai: OPENAI_API_KEY ? 'configured' : 'missing'
    }
  });
});

// Endpoint to retrieve conversation history
app.get('/history', (req, res) => {
  // Optional limit parameter
  const limit = req.query.limit ? parseInt(req.query.limit) : conversationHistory.length;
  // Return the most recent conversations first, limited by the requested amount
  const limitedHistory = conversationHistory.slice(-limit).reverse();
  res.json({ history: limitedHistory });
});

// Endpoint to clear history
app.post('/clear-history', (req, res) => {
  conversationHistory = [];
  saveHistoryToFile();
  res.json({ message: 'Conversation history cleared successfully' });
});

// Feedback system
const feedbackStore = {
    ratings: [],
    patterns: {},
    analytics: {
        totalResponses: 0,
        successRate: 0,
        bestPatterns: [],
        recentTrends: []
    }
};

// NOCTURNE FEEDBACK STORAGE
const feedbackLogsPath = path.join(__dirname, 'data', 'feedback_logs.jsonl');

// Endpoint för att spara feedback (Phase 2 ML)
app.post('/feedback', async (req, res) => {
    try {
        // Security: Sanitize feedback inputs
        const { 
            reply, 
            score, 
            rating, 
            context, 
            timestamp, 
            userAgent,
            originalReply,
            editedReply,
            wasEdited,
            editDiff,
            learningType
        } = req.body;
        
        // Sanitize string inputs
        const sanitizedReply = sanitizeString(reply || '', 5000);
        const sanitizedRating = sanitizeString(rating || '', 20);
        const sanitizedOriginalReply = sanitizeString(originalReply || '', 5000);
        const sanitizedEditedReply = sanitizeString(editedReply || '', 5000);
        const sanitizedUserAgent = sanitizeString(userAgent || '', 500);
        
        // Log feedback for ML training (Phase 2)
        const feedbackEntry = {
            timestamp: timestamp || new Date().toISOString(),
            reply: sanitizedReply,
            score: typeof score === 'number' ? Math.max(0, Math.min(10, score)) : 0,
            rating: sanitizedRating, // 'great' | 'good' | 'bad' | 'edited'
            context: context || {},
            userAgent: sanitizedUserAgent
        };
        
        // Add edit learning data if available
        if(wasEdited && sanitizedOriginalReply && sanitizedEditedReply){
            feedbackEntry.learningType = 'edit';
            feedbackEntry.originalReply = sanitizedOriginalReply;
            feedbackEntry.editedReply = sanitizedEditedReply;
            feedbackEntry.editDiff = editDiff || {};
            feedbackEntry.wasEdited = true;
            
            console.log(`[Nocturne] Edit learning: User improved reply`);
            console.log(`  Original (${sanitizedOriginalReply.length} chars): ${sanitizedOriginalReply.substring(0, 50)}...`);
            console.log(`  Edited (${sanitizedEditedReply.length} chars): ${sanitizedEditedReply.substring(0, 50)}...`);
            console.log(`  Similarity: ${editDiff?.similarity?.toFixed(2) || 'N/A'}`);
        }
        
        // Append to JSONL file
        try {
            fs.appendFileSync(feedbackLogsPath, JSON.stringify(feedbackEntry) + '\n', 'utf8');
        } catch (err) {
            console.error('[Nocturne] Failed to log feedback:', err);
        }
        
        // Update in-memory feedback store (legacy)
        feedbackStore.ratings.push({
            reply: sanitizedEditedReply || sanitizedReply, // Use edited version if available
            rating: wasEdited ? 'edited' : sanitizedRating,
            context: context || {},
            timestamp: Date.now(),
            wasEdited: wasEdited || false,
            originalReply: sanitizedOriginalReply || null
        });

        // Uppdatera statistik
        feedbackStore.analytics.totalResponses++;
        
        // Analysera mönster i svaret
        const patterns = await analyzeResponse(sanitizedReply);
        
        // Uppdatera pattern stats och score
        patterns.forEach(pattern => {
            if (!feedbackStore.patterns[pattern]) {
                feedbackStore.patterns[pattern] = {
                    success: 0,
                    total: 0,
                    score: 0
                };
            }
            feedbackStore.patterns[pattern].total++;
            if (sanitizedRating === 'great') {
                feedbackStore.patterns[pattern].success++;
                feedbackStore.patterns[pattern].score += 2;
            } else if (sanitizedRating === 'good') {
                feedbackStore.patterns[pattern].score += 1;
            } else if (sanitizedRating === 'bad') {
                feedbackStore.patterns[pattern].score -= 2;
            }
        });

        // Beräkna success rate
        const totalGreat = feedbackStore.ratings.filter(r => r.rating === 'great').length;
        feedbackStore.analytics.successRate = (totalGreat / feedbackStore.analytics.totalResponses) * 100;

        // Uppdatera best patterns
        updateBestPatterns();

        // Decay all pattern scores slightly on each feedback
        Object.values(feedbackStore.patterns).forEach(p => {
            p.score *= 0.98; // Decay by 2% each time feedback is submitted
        });

        console.log(`[Nocturne] Feedback received: ${sanitizedRating} (score: ${feedbackEntry.score})${wasEdited ? ' [EDIT LEARNING]' : ''}`);
        
        res.json({ 
            success: true, 
            stored: true,
            learningType: wasEdited ? 'edit' : 'feedback',
            editAnalyzed: wasEdited || false
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        // Security: Don't expose internal error details
        res.status(500).json({ error: 'Internal server error', success: false });
    }
});

// GET endpoint for learning analytics
app.get('/learning-analytics', (req, res) => {
    try {
        // Read feedback logs - Security: Safe JSON parsing
        let feedbackData = [];
        if (fs.existsSync(feedbackLogsPath)) {
            const content = fs.readFileSync(feedbackLogsPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            feedbackData = lines.map(line => safeJsonParse(line, null)).filter(Boolean);
        }
        
        // Read scoring logs - Security: Safe JSON parsing
        let scoringData = [];
        if (fs.existsSync(scoringLogsPath)) {
            const content = fs.readFileSync(scoringLogsPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim());
            scoringData = lines.map(line => safeJsonParse(line, null)).filter(Boolean);
        }
        
        // Calculate statistics
        const totalFeedback = feedbackData.length;
        const totalEdits = feedbackData.filter(f => f.wasEdited).length;
        const totalGenerations = scoringData.length;
        
        // Rating breakdown
        const ratings = {
            great: feedbackData.filter(f => f.rating === 'great').length,
            good: feedbackData.filter(f => f.rating === 'good').length,
            edited: feedbackData.filter(f => f.rating === 'edited').length,
            bad: feedbackData.filter(f => f.rating === 'bad').length
        };
        
        // Edit statistics
        const edits = feedbackData.filter(f => f.wasEdited);
        const avgSimilarity = edits.length > 0
            ? edits.reduce((sum, e) => sum + (e.editDiff?.similarity || 0), 0) / edits.length
            : 0;
        
        const avgLengthChange = edits.length > 0
            ? edits.reduce((sum, e) => sum + Math.abs(e.editDiff?.lengthChange || 0), 0) / edits.length
            : 0;
        
        // Most common removed words (from edits)
        const allRemovedWords = edits
            .flatMap(e => e.editDiff?.removedWords || [])
            .filter(w => w.length > 2); // Filter short words
        
        const wordCounts = {};
        allRemovedWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        const topRemovedWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
        
        // Most common added words
        const allAddedWords = edits
            .flatMap(e => e.editDiff?.addedWords || [])
            .filter(w => w.length > 2);
        
        const addedWordCounts = {};
        allAddedWords.forEach(word => {
            addedWordCounts[word] = (addedWordCounts[word] || 0) + 1;
        });
        
        const topAddedWords = Object.entries(addedWordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
        
        // Score statistics
        const allScores = scoringData.flatMap(s => s.scored?.map(sc => sc.score) || []);
        const avgScore = allScores.length > 0
            ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
            : 0;
        
        const scoreDistribution = {
            excellent: allScores.filter(s => s >= 8.5).length,
            good: allScores.filter(s => s >= 7.5 && s < 8.5).length,
            ok: allScores.filter(s => s >= 6.5 && s < 7.5).length,
            poor: allScores.filter(s => s < 6.5).length
        };
        
        res.json({
            summary: {
                totalGenerations,
                totalFeedback,
                totalEdits,
                editRate: totalFeedback > 0 ? (totalEdits / totalFeedback * 100).toFixed(1) : 0,
                avgScore: avgScore.toFixed(2)
            },
            ratings,
            edits: {
                count: totalEdits,
                avgSimilarity: avgSimilarity.toFixed(2),
                avgLengthChange: Math.round(avgLengthChange),
                topRemovedWords,
                topAddedWords
            },
            scores: {
                avg: avgScore.toFixed(2),
                distribution: scoreDistribution
            },
            recent: {
                last10Feedback: feedbackData.slice(-10).reverse(),
                last10Generations: scoringData.slice(-10).reverse()
            }
        });
    } catch (error) {
        console.error('[Nocturne] Analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Funktion för att analysera svarsmönster
async function analyzeResponse(response) {
    const patterns = [];
    
    // Identifiera språkmönster
    if (response.includes('?')) patterns.push('question');
    if (response.length < 100) patterns.push('short');
    if (response.length > 300) patterns.push('long');
    
    // Identifiera känslor/ton
    if (/haha|hihi|😊|😄/.test(response)) patterns.push('playful');
    if (/tyvärr|ledsen|förlåt/.test(response)) patterns.push('apologetic');
    if (/!/.test(response)) patterns.push('enthusiastic');
    
    return patterns;
}

// Uppdatera best patterns
function updateBestPatterns() {
    const patterns = Object.entries(feedbackStore.patterns)
        .map(([pattern, stats]) => ({
            pattern,
            successRate: (stats.success / stats.total) * 100
        }))
        .filter(p => p.total >= 5); // Minst 5 exempel
    
    patterns.sort((a, b) => b.successRate - a.successRate);
    feedbackStore.analytics.bestPatterns = patterns.slice(0, 5);
}

// Endpoint för att hämta feedback analytics
app.get('/feedback/analytics', (req, res) => {
    res.json(feedbackStore.analytics);
});

// Endpoint to handle chat completions
app.post('/generate', async (req, res) => {
  try {
    // Validate request
    const { prompt, numReplies = 1 } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        reply: 'ERROR: The server is not properly configured with an API key. Please set up your OPENAI_API_KEY in the .env file.'
      });
    }

    console.log(`Received prompt: ${prompt.substring(0, 100)}...`);
    console.log(`Requested ${numReplies} replies`);
    
    const timestamp = new Date().toISOString();

    // Adjust system prompt to request multiple options if needed
    let systemContent = "";
    if (prompt.includes('System Instructions:')) {
      systemContent = prompt.split('System Instructions:')[1].split('\n\nPlease generate')[0].trim();
      
      // If multiple responses requested, add this to the system prompt
      if (numReplies > 1) {
        systemContent += `\n\nPlease provide ${numReplies} different response options to choose from. Label them clearly as "Option 1:", "Option 2:", etc.`;
      }
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          // Extract the system instructions from the prompt if they exist
          ...(systemContent ? [
            { 
              role: 'system', 
              content: systemContent 
            }
          ] : []),
          // Include the whole prompt as user content as well to maintain compatibility
          { role: 'user', content: prompt }
        ],
        max_tokens: numReplies > 1 ? 800 : 500, // Increase token limit for multiple replies
        temperature: 0.7,
        n: 1, // We'll handle multiple responses through formatting
      })
    });

    const data = await response.json();
    
    // Check for errors from OpenAI
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      
      // Store the error in history
      conversationHistory.push({
        timestamp,
        prompt: prompt,
        reply: `Error: ${data.error.message}`,
        error: true
      });
      
      // Trim history if it exceeds the maximum
      if (conversationHistory.length > MAX_HISTORY_ITEMS) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
      }
      
      saveHistoryToFile();
      
      return res.status(500).json({ 
        error: data.error.message,
        reply: `Error from AI service: ${data.error.message}`
      });
    }

    // Extract the generated text
    let reply = data.choices && data.choices[0] ? data.choices[0].message.content.trim() : 'No response generated';
    
    // If multiple replies were requested and the response doesn't have options format
    if (numReplies > 1 && !reply.includes('Option 1:')) {
      // Try to reformat the response as options
      const paragraphs = reply.split(/\n{2,}/).filter(p => p.trim().length > 0);
      
      if (paragraphs.length > 1) {
        // Format paragraphs as options
        reply = paragraphs.slice(0, numReplies).map((p, i) => `Option ${i+1}: ${p.trim()}`).join('\n\n');
      } else {
        // If we can't split into paragraphs, make a second API call explicitly requesting options
        try {
          const optionPrompt = prompt + `\n\nPlease provide exactly ${numReplies} different response options, clearly labeled as "Option 1:", "Option 2:", etc.`;
          
          const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: GPT_MODEL,
              messages: [
                ...(systemContent ? [{ role: 'system', content: systemContent }] : []),
                { role: 'user', content: optionPrompt }
              ],
              max_tokens: 800,
              temperature: 0.8
            })
          });
          
          const secondData = await secondResponse.json();
          if (!secondData.error && secondData.choices && secondData.choices[0]) {
            const secondReply = secondData.choices[0].message.content.trim();
            if (secondReply.includes('Option 1:')) {
              reply = secondReply;
            }
          }
        } catch (error) {
          console.error('Error in second API call:', error);
          // Continue with original reply if second call fails
        }
      }
    }
    
    console.log(`Generated reply: ${reply.substring(0, 100)}...`);

    // Store in history
    conversationHistory.push({
      timestamp,
      prompt: prompt,
      reply: reply,
      error: false
    });
    
    // Trim history if it exceeds the maximum
    if (conversationHistory.length > MAX_HISTORY_ITEMS) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
    }
    
    saveHistoryToFile();

    // Return the generated text
    return res.json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    
    // Store the error in history
    const timestamp = new Date().toISOString();
    conversationHistory.push({
      timestamp,
      prompt: req.body.prompt || 'Unknown prompt',
      reply: `Server error: ${error.message}`,
      error: true
    });
    
    // Trim history if it exceeds the maximum
    if (conversationHistory.length > MAX_HISTORY_ITEMS) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
    }
    
    saveHistoryToFile();
    
    return res.status(500).json({ 
      error: error.message,
      reply: `Server error: ${error.message}`
    });
  }
});

// Mock endpoint for testing without OpenAI API
app.post('/mock-generate', (req, res) => {
  const { prompt } = req.body;
  
  console.log(`Received prompt at mock endpoint: ${prompt.substring(0, 100)}...`);
  
  // Extract system instructions if they exist
  let systemPrompt = "";
  if (prompt.includes('System Instructions:')) {
    systemPrompt = prompt.split('System Instructions:')[1].split('\n\nPlease generate')[0].trim();
  }
  
  const timestamp = new Date().toISOString();
  
  // Generate a better formatted mock reply
  let mockReply;
  
  // If it has a Swedish system prompt, provide a Swedish mock response
  if (systemPrompt.includes('svenska') || systemPrompt.includes('flörtig')) {
    mockReply = "Jag känner rysningar när jag läser dina ord. Min kropp reagerar direkt på hur du beskriver din kväll. Jag skulle så gärna vilja veta mer om dina fantasier - vilken del av din kropp längtar mest efter beröring just nu?";
  } else {
    mockReply = "This is a mock response designed to test your Tampermonkey script without making actual API calls to OpenAI. In a proper implementation, I would respond according to the system instructions provided.";
  }
  
  // Store in history
  conversationHistory.push({
    timestamp,
    prompt: prompt,
    reply: mockReply,
    error: false,
    mock: true
  });
  
  // Trim history if it exceeds the maximum
  if (conversationHistory.length > MAX_HISTORY_ITEMS) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
  }
  
  saveHistoryToFile();
  
  // Return mock response
  setTimeout(() => {
    res.json({
      reply: mockReply
    });
  }, 1000); // Simulate 1 second delay
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Endpoint för att hämta detaljerad feedback-data
app.get('/feedback/details', (req, res) => {
  // Hämta de senaste 50 feedback-items
  const recentFeedback = feedbackStore.ratings
    .slice(-50)
    .reverse()
    .map(item => ({
      timestamp: item.timestamp,
      rating: item.rating,
      response: item.response.substring(0, 100) + '...', // Truncate long responses
      patterns: analyzeResponse(item.response)
    }));

  res.json({
    recentFeedback,
    patterns: feedbackStore.patterns,
    analytics: {
      ...feedbackStore.analytics,
      averageLength: calculateAverageLength(),
      patternDistribution: calculatePatternDistribution()
    }
  });
});

// Hjälpfunktioner för analytics
function calculateAverageLength() {
  if (feedbackStore.ratings.length === 0) return 0;
  const totalLength = feedbackStore.ratings.reduce((sum, item) => sum + item.response.length, 0);
  return Math.round(totalLength / feedbackStore.ratings.length);
}

function calculatePatternDistribution() {
  const distribution = {};
  Object.entries(feedbackStore.patterns).forEach(([pattern, stats]) => {
    distribution[pattern] = {
      total: stats.total,
      successRate: (stats.success / stats.total) * 100
    };
  });
  return distribution;
}

// Endpoint för att hämta top patterns
app.get('/feedback/top-patterns', (req, res) => {
    // Sort patterns by score
    const sorted = Object.entries(feedbackStore.patterns)
        .map(([pattern, stats]) => ({ pattern, ...stats }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10
    res.json(sorted);
});

// Helper to get top patterns for prompt integration
function getTopPatternsText(limit = 3) {
    const sorted = Object.entries(feedbackStore.patterns)
        .map(([pattern, stats]) => ({ pattern, ...stats }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    if (sorted.length === 0) return '';
    return '\nToppmönster att använda i svaret: ' + sorted.map(p => p.pattern).join(', ');
}

// --- EXPLICIT NLP ENDPOINTS ---

// Endpoint for explicit content generation
app.post('/generate-explicit', async (req, res) => {
    try {
        const { prompt, intensity = 2, persona = 'sensual', temperature = 0.7, chatHistory = [] } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`Generating explicit content with intensity ${intensity}, persona ${persona}`);
        
        // Generate explicit content using NLP processor
        const result = await explicitNLP.generateExplicitContent(prompt, intensity, persona, temperature, chatHistory);
        
        // Store in history with explicit flag
        const timestamp = new Date().toISOString();
        conversationHistory.push({
            timestamp,
            prompt: prompt,
            reply: result.replies.join('\n\n---\n\n'),
            error: false,
            explicit: true,
            intensity: intensity,
            persona: persona
        });
        
        // Trim history if it exceeds the maximum
        if (conversationHistory.length > MAX_HISTORY_ITEMS) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_ITEMS);
        }
        
        saveHistoryToFile();
        
        res.json({
            replies: result.replies,
            intensity: result.intensity || intensity,
            persona: persona,
            context: result.context || null,
            enhanced: result.enhanced || false
        });
        
    } catch (error) {
        console.error('Explicit content generation failed:', error);
        
        // Store error in history
        const timestamp = new Date().toISOString();
        conversationHistory.push({
            timestamp,
            prompt: req.body.prompt || 'Unknown prompt',
            reply: `Explicit generation error: ${error.message}`,
            error: true,
            explicit: true
        });
        
        saveHistoryToFile();
        
        res.status(500).json({ 
            error: error.message,
            replies: [`Error generating explicit content: ${error.message}`]
        });
    }
});

// Endpoint for explicit content with fallback
app.post('/generate-fallback', async (req, res) => {
    try {
        const { prompt, intensity = 2, persona = 'sensual' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`Generating explicit content with fallback strategy`);
        
        // Try explicit generation first
        try {
            const result = await explicitNLP.generateExplicitContent(prompt, intensity, persona);
            res.json({
                replies: result.replies,
                intensity: intensity,
                persona: persona,
                strategy: 'explicit',
                fallback: false
            });
        } catch (explicitError) {
            console.log('Explicit generation failed, trying fallback...');
            
            // Fallback to regular generation with modified prompt
            const fallbackPrompt = `${prompt}\n\n# FALLBACK MODE: Generate natural, engaging responses that match the conversation's tone.`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: GPT_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a natural, engaging conversationalist who understands human emotions and relationships. You communicate in Swedish with warmth and authenticity.'
                        },
                        { role: 'user', content: fallbackPrompt }
                    ],
                    max_tokens: 600,
                    temperature: 0.8
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            const reply = data.choices[0].message.content.trim();
            const replies = [reply];
            
            res.json({
                replies: replies,
                intensity: intensity,
                persona: persona,
                strategy: 'fallback',
                fallback: true
            });
        }
        
    } catch (error) {
        console.error('Fallback generation failed:', error);
        res.status(500).json({ 
            error: error.message,
            replies: [`Error: ${error.message}`]
        });
    }
});

// Endpoint for local model generation (if available)
app.post('/generate-local', async (req, res) => {
    try {
        const { prompt, intensity = 2, persona = 'sensual' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`Generating with local model (not implemented yet)`);
        
        // This would integrate with a local LLM model
        // For now, return a placeholder response
        res.json({
            replies: [
                "Local model generation not yet implemented. This would use an open-source model like Llama or Mistral for explicit content generation.",
                "Local models can be more permissive with explicit content compared to commercial APIs.",
                "Implementation would require setting up a local LLM server with appropriate model weights."
            ],
            intensity: intensity,
            persona: persona,
            strategy: 'local',
            implemented: false
        });
        
    } catch (error) {
        console.error('Local generation failed:', error);
        res.status(500).json({ 
            error: error.message,
            replies: [`Error: ${error.message}`]
        });
    }
});

// Endpoint for context analysis
app.post('/analyze-context', async (req, res) => {
    try {
        const { chatHistory = [] } = req.body;
        
        const analysis = explicitNLP.analyzeContext(chatHistory);
        
        res.json({
            analysis: analysis,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Context analysis failed:', error);
        res.status(500).json({ 
            error: error.message,
            analysis: null
        });
    }
});

// --- NOCTURNE ML QUALITY SCORING SYSTEM ---
// Storage for quality scoring logs (Phase 1 ML)
const scoringLogsPath = path.join(__dirname, 'data', 'scoring_logs.jsonl');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

/**
 * Helper: Score replies with GPT-4o-mini
 * Returns array of {text, score} objects
 */
async function scoreRepliesWithGPT(replies, context, latestMessage) {
    if (!OPENAI_API_KEY || replies.length === 0) {
        return replies.map(text => ({ text, score: 10 }));
    }

    const scoringPrompt = `You are a quality scorer for flirty Swedish chat replies. Score each option 0-10.

CONTEXT:
Latest message from him: "${latestMessage}"
Previous conversation: ${context || '(No history)'}

YOUR TASK: Score each reply on this scale:
10 = Perfect (150+ chars after translation, includes question, natural Swedish texting, flirty, contextual, no activities, sounds human, NO emojis, CAPTIVATING)
7-9 = Good (minor issues - slightly formal or generic, could be more engaging)
4-6 = Mediocre (awkward phrasing, too formal, weak connection to context, missing question, or too short)
0-3 = Bad (suggests IRL activities, Netflix, gaming, contains emojis, or totally off-topic)

CRITICAL REQUIREMENTS (MUST CHECK):
✓ Minimum 150 characters per reply (prefer 180-250 for more engaging responses)
✓ Must include at least ONE question
✓ NO emojis, emoticons, or symbols
✓ Should be CAPTIVATING and engaging - make him want to respond

CRITICAL DEDUCTIONS:
-10 points: Suggests Netflix, movies, shows, gaming, restaurants, meeting IRL
-10 points: Contains ANY emojis, emoticons, or symbols (user adds them manually)
-5 points: Uses "eller" chains ("eller nåt annat")
-5 points: Contains English words ("nice", "cool", "awesome", "lately", "maybe", "actually", "really") in Swedish context
-5 points: Missing question (must have at least one question mark)
-3 points: Under 150 characters
-3 points: Sounds formal/robotic, not casual texting style
-3 points: Too generic ("Det låter intressant", "Berätta mer")
-2 points: Not captivating enough - lacks intrigue or engagement
-2 points: Too poetic/philosophical
-2 points: Long formal sentences instead of short SMS-style
-1 point: Over 300 characters (too long)

GOOD SWEDISH TEXTING STYLE:
✓ Short sentences, casual tone
✓ Natural flow, like real texting
✓ Specific reactions to HIS message
✓ Shows personality and interest
✓ Flirty but natural
✓ 180-250 characters (longer, more engaging)
✓ Includes a question
✓ NO emojis
✓ CAPTIVATING - creates intrigue and makes him want to respond

BAD SWEDISH TEXTING STYLE:
❌ "Det låter intressant. Berätta mer om vad du tänker?" (too generic, formal, no question)
❌ "Närhet är alltid nice 😊" (English word, emoji)
❌ "Saknar den intimiteten också.. Vad har du tänkt på lately?" (English word "lately" should be "nyligen")
❌ "Jag förstår dina känslor om närhet. Vad får dig att känna så?" (too formal, robotic)
❌ "Mm jag känner samma sak." (too short, no question)

REPLIES TO SCORE:
${replies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Respond ONLY with scores in this format (one per line):
1: 8.5
2: 3.0
3: 9.0
etc.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Fast + cheap
                messages: [{ role: 'user', content: scoringPrompt }],
                temperature: 0.1, // Very deterministic
                max_tokens: 200
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('[Nocturne] GPT scoring failed:', data.error);
            return replies.map(text => ({ text, score: 10 }));
        }

        const scores = data.choices?.[0]?.message?.content?.trim() || '';
        console.log('[Nocturne] GPT scores:', scores);

        // Parse scores: "1: 8.5\n2: 3.0\n3: 9.0"
        const lines = scores.split('\n').filter(l => l.trim());
        const scored = replies.map((text, i) => {
            const match = lines[i]?.match(/^\d+:\s*(\d+\.?\d*)/);
            const score = match ? parseFloat(match[1]) : 10;
            return { text, score };
        });

        return scored;

    } catch (err) {
        console.error('[Nocturne] GPT scoring error:', err);
        return replies.map(text => ({ text, score: 10 }));
    }
}

/**
 * Helper: Log scoring results for future ML training
 */
function logScoringResult(data) {
    try {
        const logEntry = JSON.stringify({
            timestamp: new Date().toISOString(),
            ...data
        }) + '\n';
        
        fs.appendFileSync(scoringLogsPath, logEntry, 'utf8');
    } catch (error) {
        console.error('[Nocturne] Failed to log scoring result:', error);
    }
}

/**
 * MAIN ENDPOINT: Generate with ML Quality Scoring
 * This is the Phase 1 implementation that combines:
 * - Ollama generation (English)
 * - GPT translation (English → Swedish)
 * - GPT quality scoring (0-10 scale)
 * - Logging for future ML training
 */
app.post('/generate-with-scoring', generationLimiter, async (req, res) => {
    try {
        // Security: Input validation
        const { 
            history = [], 
            latestMessage, 
            ollamaUrl = 'http://localhost:11434/api/generate',
            ollamaModel = 'nocturne-swe',
            generateCount = 5,  // Reduced from 7 for faster generation
            scoreThreshold = 7.0
        } = req.body;

        // Validate inputs
        try {
            validateArray(history, 'history', 50);
            validateString(latestMessage, 'latestMessage', 2000);
            validateString(ollamaUrl, 'ollamaUrl', 500);
            validateString(ollamaModel, 'ollamaModel', 100);
            validateNumber(generateCount, 'generateCount', 1, 20);
            validateNumber(scoreThreshold, 'scoreThreshold', 0, 10);
        } catch (validationError) {
            console.error('[Security] Input validation failed:', validationError.message);
            return res.status(400).json({ error: validationError.message });
        }

        // Sanitize inputs
        const sanitizedHistory = sanitizeArray(history, 50);
        const sanitizedLatestMessage = sanitizeString(latestMessage, 2000);
        const sanitizedOllamaUrl = sanitizeString(ollamaUrl, 500);
        const sanitizedOllamaModel = sanitizeString(ollamaModel, 100);

        // Validate history items structure
        for (let i = 0; i < sanitizedHistory.length; i++) {
            const item = sanitizedHistory[i];
            if (!item || typeof item !== 'object') {
                return res.status(400).json({ error: `History item ${i} must be an object` });
            }
            if (item.role !== 'user' && item.role !== 'assistant') {
                return res.status(400).json({ error: `History item ${i} has invalid role` });
            }
            if (typeof item.content !== 'string' || item.content.length > 5000) {
                return res.status(400).json({ error: `History item ${i} has invalid content` });
            }
        }

        console.log(`[Nocturne] Generate with scoring: ${generateCount} options, threshold ${scoreThreshold}`);

        // 1. Translate history to English (OPTIMIZED: Start prompt prep in parallel)
        let englishHistory = sanitizedHistory;
        const historyTranslationPromise = sanitizedHistory.length > 0 ? (async () => {
            const historyText = sanitizedHistory.map(m => {
                const label = m.role === 'user' ? 'Him' : 'Me';
                return `${label}: ${m.content}`;
            }).join('\n');

            const translatePrompt = `Translate this Swedish conversation to natural English. Keep it casual and direct.\n\nSwedish conversation:\n${historyText}\n\nEnglish translation (same format):`;

            const translateResp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: translatePrompt }],
                    temperature: 0.3,
                    max_tokens: 300  // Reduced from 500 for faster response
                })
            });

            const translateData = await translateResp.json();
            const translated = translateData.choices?.[0]?.message?.content?.trim() || '';
            const lines = translated.split('\n').filter(l => l.trim());
            
            return lines.map(line => {
                const match = line.match(/^(Him|Me):\s*(.+)$/);
                if (match) {
                    return {
                        role: match[1] === 'Him' ? 'user' : 'assistant',
                        content: match[2].trim()
                    };
                }
                return null;
            }).filter(Boolean);
        })() : Promise.resolve([]);

        // 2. Build prompt structure (can be done in parallel with translation)
        const contextMessages = sanitizedHistory.slice(-8, -1); // Last 7 messages (excluding latest)
        const context = contextMessages.length > 0 
            ? contextMessages.map(m => `${m.role === 'user' ? 'Him' : 'Me'}: ${m.content}`).join('\n')
            : '';
        
        let prompt = `Conversation history (USE THIS ACTIVELY - reference specific details from earlier messages):
${context || '(No previous conversation)'}

LATEST MESSAGE TO RESPOND TO (PRIMARY FOCUS):
"${sanitizedLatestMessage}"

CRITICAL INSTRUCTIONS:
1. PRIMARY FOCUS: React directly to the LATEST MESSAGE above
2. ACTIVE USE OF HISTORY: Reference specific details from conversation history (e.g., if he mentioned watching a movie earlier, ask about it or reference it)
3. COMBINE BOTH: Connect the latest message with earlier conversation topics naturally
4. EXAMPLE: If he said "watching a movie" earlier and latest is "missing closeness", you could say "Still watching that movie? I can relate to missing closeness tonight..."
5. Don't ignore earlier topics - weave them into your response naturally`;

        // Wait for translation to complete
        const translatedHistory = await historyTranslationPromise;
        if (translatedHistory.length > 0) {
            englishHistory = translatedHistory;
            // Rebuild context with translated history
            const translatedContextMessages = englishHistory.slice(-8, -1);
            if (translatedContextMessages.length > 0) {
                const translatedContext = translatedContextMessages.map(m => `${m.role === 'user' ? 'Him' : 'Me'}: ${m.content}`).join('\n');
                // Update prompt with translated context
                const updatedPrompt = `Conversation history (USE THIS ACTIVELY - reference specific details from earlier messages):
${translatedContext || '(No previous conversation)'}

LATEST MESSAGE TO RESPOND TO (PRIMARY FOCUS):
"${sanitizedLatestMessage}"

CRITICAL INSTRUCTIONS:
1. PRIMARY FOCUS: React directly to the LATEST MESSAGE above
2. ACTIVE USE OF HISTORY: Reference specific details from conversation history (e.g., if he mentioned watching a movie earlier, ask about it or reference it)
3. COMBINE BOTH: Connect the latest message with earlier conversation topics naturally
4. EXAMPLE: If he said "watching a movie" earlier and latest is "missing closeness", you could say "Still watching that movie? I can relate to missing closeness tonight..."
5. Don't ignore earlier topics - weave them into your response naturally`;
                
                // Use translated prompt
                prompt = updatedPrompt;
            }
        }

        // 3. Call Ollama (local or RunPod Serverless)
        const systemPrompt = `You are a flirty, confident Swedish woman texting. ${generateCount === 1 
            ? 'Generate EXACTLY 1 reply option in ENGLISH (will be translated to Swedish).\n\nMANDATORY FORMAT - Start immediately:\nOption 1: [reply]\n\nNO preamble. NO explanations. Just start with "Option 1:" followed by your reply.'
            : `Generate EXACTLY ${generateCount} reply options in ENGLISH (will be translated to Swedish).\n\nMANDATORY FORMAT - Start immediately:\nOption 1: [reply]\nOption 2: [reply]\nOption 3: [reply]\n...\n\nNO preamble. NO explanations. Just the options.`}

CRITICAL REQUIREMENTS (MUST FOLLOW):
1. Each reply MUST be 200-280 characters (aim for longer to account for translation - Swedish may be shorter!)
   ⚠️ THIS IS CRITICAL: Count your characters! Each reply MUST be at least 200 characters long!
   ⚠️ Short replies (under 200 chars) will be REJECTED - make them LONGER!
2. PRIMARY FOCUS: React DIRECTLY to the LATEST MESSAGE (this is your main topic)
3. ACTIVE HISTORY USE: Reference specific details from conversation history to add context and length
   - If he mentioned watching a movie earlier → ask about it or reference it
   - If he mentioned being home → connect it to current feelings
   - If he mentioned something specific → weave it into your response naturally
4. COMBINE BOTH: Don't just react to latest message - connect it with earlier conversation topics
5. Each reply MUST include at least ONE question to keep conversation going
6. NO emojis whatsoever (user will add them manually)
   - NO "*wink*", "*smile*", "*laugh*" or any text-based symbols
   - NO (wink), (smile), (laugh) or parentheses symbols
   - NO emoji characters whatsoever
7. Use conversation history to ADD DEPTH and LENGTH - reference previous messages, build continuity, expand on themes
8. Natural SMS texting style - short sentences, casual, like real texting
9. Show interest and curiosity about HIM specifically
10. BE CAPTIVATING - make him want to respond immediately
11. Be more provocative and intriguing - create tension and curiosity
12. Use specific details and personal touches to make it feel real
13. EXPAND on the conversation history - use it to create longer, more engaging replies
14. Reference what was said earlier to add context and length - actively use history, don't ignore it
15. ⚠️ LENGTH CHECK: Before finishing each option, COUNT THE CHARACTERS! If under 200, ADD MORE CONTENT!

TONALITY - Write like a real Swedish woman texting:
- Casual, relaxed, confident
- Short sentences (not long formal paragraphs)
- Natural flow, not robotic
- Show personality and interest
- Flirty but not overly explicit
- React to HIS specific words/feelings
- BE CAPTIVATING - create intrigue and make him curious
- Be provocative and engaging - make him want to keep talking
- Use specific details from what he said to show you're really listening
- Build tension and curiosity - make him wonder what you're thinking

FORBIDDEN - NEVER suggest:
❌ Meeting/seeing each other IRL
❌ Physical activities (escape rooms, restaurants, movies, gaming, cooking)
❌ Doing anything "together" 
❌ Going anywhere
❌ Innocent activities
❌ English words like "nice", "cool", "awesome" (use Swedish equivalents after translation)
❌ ANY emojis, emoticons, or symbols (user adds them manually)

FOCUS ON:
✓ LATEST MESSAGE is PRIMARY - respond directly to what he just said
✓ USE CONVERSATION HISTORY to ADD LENGTH - reference previous messages, build on themes, expand context
✓ HIS thoughts, feelings, desires, tension in the LATEST message
✓ What's really on his mind RIGHT NOW (from latest message)
✓ Charged/intimate energy when he flirts (in latest message)
✓ Direct reactions to his SPECIFIC latest words/feelings
✓ Show you're listening and interested in HIM
✓ BE CAPTIVATING - make him want to respond immediately
✓ Create intrigue and curiosity - what are you thinking? What are you feeling?
✓ Be provocative and engaging - build tension, make it interesting
✓ Use specific details from his message to show you're really paying attention
✓ EXPAND on conversation history - use it to create longer, more contextual replies
✓ Reference previous messages to add depth and length - don't just react to latest

GOOD EXAMPLES (English - will be translated, 200-280 chars, includes question, CAPTIVATING, ACTIVE HISTORY USE):
Option 1: Mm I feel that too. Been thinking about some pretty intense things tonight myself. There's something about the way you're talking that's got me curious. What's really on your mind right now? I can sense there's more you're not saying.
Option 2: Still watching that movie? I can relate to missing closeness tonight. There's something about being alone with your thoughts that makes you crave connection. What kind of closeness are you thinking about? The way you describe it makes me wonder what's really going through your head.
Option 3: Oh yeah I can tell. There's definitely something charged about the way you're talking. I can sense there's more you're not saying. What are you holding back? The way you describe it makes me wonder what's going through your head.

BAD EXAMPLES (TOO SHORT - WILL BE REJECTED):
❌ "Want to watch Netflix together?" (activity, too short - only ~30 chars)
❌ "More excitement or something else?" (eller-chain, too short - only ~40 chars)
❌ "That sounds nice. Tell me more." (too generic, formal, no question, too short - only ~35 chars)
❌ "I understand your feelings about closeness. What makes you feel that way?" (too formal, robotic, too short - only ~70 chars)
❌ "Mm I feel it too. What kind of closeness are you missing tonight?" (TOO SHORT - only ~70 chars, needs to be 200+!)

Generate ${generateCount} options NOW. Each MUST be 200-280 characters in English (will translate to ~160-180 in Swedish), include a question, NO emojis. Natural, flirty, direct, CAPTIVATING. Make him want to respond immediately. NO activities.

⚠️ CRITICAL: COUNT YOUR CHARACTERS! Each option MUST be at least 200 characters long! Short replies will be REJECTED!
⚠️ ACTIVE HISTORY USE: Reference specific details from conversation history (movies, activities, feelings mentioned earlier) - don't ignore earlier messages!
⚠️ COMBINE: Connect latest message with earlier topics naturally - if he mentioned watching a movie, reference it!
⚠️ If your reply is under 200 characters, ADD MORE CONTENT - expand on feelings, add details, reference history!`;

        let rawResponse = '';

        // Use RunPod Serverless if explicitly forced (USE_RUNPOD=true)
        if (USE_RUNPOD && RUNPOD_ENDPOINT_URL && RUNPOD_API_KEY) {
            try {
                console.log('[Nocturne] Calling RunPod Serverless...');
                const runpodResult = await callRunPodServerless(
                    RUNPOD_ENDPOINT_URL,
                    RUNPOD_API_KEY,
                    sanitizedOllamaModel,
                    prompt,
                    systemPrompt,
                    {
                        temperature: 0.85,
                        top_p: 0.9,
                        repeat_penalty: 1.3,
                        num_ctx: 4096,
                        num_predict: 600
                    },
                    120000 // 2 minute timeout
                );
                rawResponse = runpodResult.response;
                console.log('[Nocturne] RunPod Serverless response received, length:', rawResponse.length);
                console.log('[Nocturne] RunPod response preview:', rawResponse.substring(0, 500));
            } catch (error) {
                console.error('[Nocturne] RunPod Serverless failed:', error.message);
                console.error('[Nocturne] RunPod error stack:', error.stack);
                throw error;
            }
        } else {
            // Use local Ollama (default)
            try {
                console.log('[Nocturne] Calling local Ollama...');
                const ollamaResp = await fetch(sanitizedOllamaUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: sanitizedOllamaModel,
                        prompt: prompt,
                        system: systemPrompt,
                        stream: false,
                        keep_alive: '5m',
                        options: {
                            temperature: 0.85,
                            top_p: 0.9,
                            repeat_penalty: 1.3,
                            num_ctx: 4096,
                            num_predict: 600
                        }
                    })
                });

                if (!ollamaResp.ok) {
                    throw new Error(`Ollama HTTP error: ${ollamaResp.status}`);
                }

                const ollamaData = await ollamaResp.json();
                rawResponse = ollamaData.response || '';
                console.log('[Nocturne] Local Ollama response received, length:', rawResponse.length);
            } catch (error) {
                console.warn('[Nocturne] Local Ollama failed:', error.message);
                throw error;
            }
        }

        console.log('[Nocturne] Raw response preview:', rawResponse.substring(0, 500));
        
        // Check if response was truncated
        if(rawResponse.length > 0 && !rawResponse.includes('Option ' + generateCount)) {
            console.warn('[Nocturne] WARNING: Response may be truncated - last option might be incomplete');
        }

        // 4. Parse replies (handle both single and multiple replies)
        let englishReplies = [];
        
        // Try standard "Option X:" format first
        const optionRegex = /Option\s+(\d+):\s*(.+?)(?=Option\s+\d+:|Character\s+count:|$)/gis;
        const matches = [...rawResponse.matchAll(optionRegex)];
        
        if (matches.length > 0) {
            englishReplies = matches.map(m => {
                let text = m[2].trim().replace(/\*\*/g, '').trim();
                // Remove "Character count: XXX" if present
                text = text.replace(/\s*Character\s+count:\s*\d+\s*$/i, '').trim();
                return text;
            }).filter(r => r.length > 50);
        } else {
            // Fallback: If no "Option X:" format found, try to extract the reply directly
            // This handles cases where Ollama doesn't follow the format exactly (especially for generateCount=1)
            console.warn('[Nocturne] No "Option X:" format found, trying fallback parsing...');
            console.log('[Nocturne] Raw response:', rawResponse.substring(0, 200));
            
            // Remove common prefixes and extract the actual reply
            let cleaned = rawResponse.trim();
            // Remove "Option 1:" if present but regex didn't catch it (case-insensitive, flexible spacing)
            cleaned = cleaned.replace(/^Option\s+\d+[:.]\s*/i, '');
            // Remove quotes if wrapped
            cleaned = cleaned.replace(/^["']|["']$/g, '');
            // Remove any leading/trailing whitespace
            cleaned = cleaned.trim();
            
            // If we have a substantial reply (at least 50 chars), use it
            if (cleaned.length > 50) {
                englishReplies = [cleaned];
                console.log('[Nocturne] Fallback parsing successful, extracted reply:', cleaned.substring(0, 100));
            } else {
                // Last resort: use raw response if it's long enough
                const rawTrimmed = rawResponse.trim();
                if (rawTrimmed.length > 50) {
                    englishReplies = [rawTrimmed];
                    console.log('[Nocturne] Using raw response as fallback');
                }
            }
        }
        
        // Log character counts for debugging
        englishReplies.forEach((reply, idx) => {
            console.log(`[Nocturne] Option ${idx + 1} length: ${reply.length} chars`);
        });

        if (englishReplies.length === 0) {
            console.error('[Nocturne] Failed to parse any replies from Ollama response');
            console.error('[Nocturne] Raw response length:', rawResponse.length);
            console.error('[Nocturne] Raw response preview:', rawResponse.substring(0, 500));
            throw new Error('Ollama did not return valid replies');
        }

        console.log('[Nocturne] Parsed', englishReplies.length, 'English replies');

        // 5. Translate to Swedish
        console.log('[Nocturne] Translating to Swedish...');
        const translateSystemPrompt = `You are a TRANSLATION assistant. Your ONLY job is to translate English to Swedish.

CRITICAL RULES:
1. TRANSLATE WORD-FOR-WORD when possible
2. Do NOT create new content
3. Do NOT change the meaning
4. Use NATURAL Swedish texting style (short sentences, casual)
5. NO English words in Swedish text ("nice" → "bra"/"skönt", "cool" → "schysst", "awesome" → "grymt", "lately" → "nyligen", "maybe" → "kanske")
6. NO formal language - keep it casual like SMS
7. Preserve the flirty/provocative tone
8. Keep questions natural and conversational
9. ABSOLUTELY NO emojis, emoticons, or symbols (user adds them manually)
   - NO "*wink*", "*smile*", "*laugh*" or any text-based symbols
   - NO (wink), (smile), (laugh) or parentheses symbols
   - NO emoji characters whatsoever
10. Ensure minimum 200 characters in English (will translate to ~160-180 in Swedish - aim for longer!)
11. Ensure at least ONE question mark is present
12. Translate ALL English words to Swedish - never leave English words like "lately", "maybe", "actually" in the translation
13. Make the translation CAPTIVATING - preserve the provocative and intriguing tone

SWEDISH TEXTING STYLE:
- Short sentences (not long formal paragraphs)
- Casual, relaxed tone
- Natural flow
- Like real texting between friends/flirting
- NO emojis whatsoever

BAD TRANSLATIONS (AVOID):
❌ "Närhet är alltid nice 😊" (English word, emoji)
❌ "Det låter intressant. Berätta mer om vad du tänker?" (too formal, generic, no question)
❌ Long formal sentences
❌ "Jag förstår dina känslor om närhet. Vad får dig att känna så?" (too formal, robotic)
❌ Any emojis or symbols
❌ "*wink*" or "*smile*" or any text symbols (user adds emojis manually)

GOOD TRANSLATIONS:
✓ "Mm jag känner samma sak. Vad är det som egentligen går genom huvudet på dig nu?"
✓ "Jag märker det. Det finns något laddat i hur du pratar. Vad säger du inte?"
✓ "Jag förstår. Sitter här och känner samma sak faktiskt. Vilken typ av spänning längtar du efter?"

Translate this English text to casual Swedish texting style (NO emojis, maintain 150+ chars after translation, include question, make it CAPTIVATING):`;

        // OPTIMIZED: Batch translate multiple replies in fewer API calls (batch size: 3)
        const BATCH_SIZE = 3;
        const swedishReplies = [];
        
        for (let i = 0; i < englishReplies.length; i += BATCH_SIZE) {
            const batch = englishReplies.slice(i, i + BATCH_SIZE);
            const batchTranslations = await Promise.all(batch.map(async (text) => {
                const translatePrompt = `Translate this English text to casual Swedish texting (like SMS). Keep the EXACT same meaning and tone.\n\nREMOVE all dashes and quotation marks. Write like you're texting, not writing.\n\n"${text}"\n\nSwedish translation (casual texting, no dashes, no quotes):`;
                
                const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: translateSystemPrompt },
                            { role: 'user', content: translatePrompt }
                        ],
                        temperature: 0.3,
                        max_tokens: 250  // Reduced from 300 for faster response
                    })
                });

            const data = await resp.json();
            let translated = data.choices?.[0]?.message?.content?.trim() || text;
            
            // Clean up - remove emojis, dashes, quotes, symbols
            translated = translated.replace(/^["']|["']$/g, '').trim();
            translated = translated.replace(/\*\*/g, '').trim();
            translated = translated.replace(/\s*[-–—]\s*/g, ' ');
            translated = translated.replace(/["""'']/g, '');
            translated = translated.replace(/\.{3,}/g, '..');
            // Remove ALL emojis and symbols
            translated = translated.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Emojis
            translated = translated.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
            translated = translated.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
            // Remove text-based symbols like *wink*, *smile*, etc.
            translated = translated.replace(/\*[a-zA-Z]+\*/g, ''); // *wink*, *smile*, etc.
            translated = translated.replace(/\([a-zA-Z]+\)/g, ''); // (wink), (smile), etc.
            // Remove common English words that shouldn't be in Swedish text
            translated = translated.replace(/\b(lately|maybe|perhaps|actually|really|nice|cool|awesome|yeah|ok|okay)\b/gi, (match) => {
                const replacements = {
                    'lately': 'nyligen',
                    'maybe': 'kanske',
                    'perhaps': 'kanske',
                    'actually': 'faktiskt',
                    'really': 'verkligen',
                    'nice': 'bra',
                    'cool': 'schysst',
                    'awesome': 'grymt',
                    'yeah': 'ja',
                    'ok': 'okej',
                    'okay': 'okej'
                };
                return replacements[match.toLowerCase()] || match;
            });
            // Check for remaining English words (common words that shouldn't be there)
            // Only check for common English words that are NOT Swedish words
            const englishWordPattern = /\b(lately|maybe|perhaps|actually|really|nice|cool|awesome|yeah|ok|okay|want|think|feel|know|say|tell|get|go|come|see|look|make|take|give|use|find|work|call|try|ask|need|help|play|run|move|like|live|believe|hold|bring|happen|write|provide|sit|stand|lose|pay|meet|include|continue|set|learn|change|lead|understand|watch|follow|stop|create|speak|read|allow|add|spend|grow|open|walk|win|offer|remember|love|consider|appear|buy|wait|serve|die|send|build|stay|fall|cut|reach|kill|raise|pass|sell|decide|return|agree|support|hit|produce|eat|cover|catch|draw|choose|wear|fight|throw|accept|belong|break|clean|climb|close|cook|count|cry|dance|describe|drive|enjoy|enter|explain|explore|fix|forget|hate|hear|hope|hunt|improve|join|jump|keep|kick|knock|leave|lie|listen|miss|pack|paint|pick|pull|push|put|rain|rest|ring|save|set|shake|shine|shoot|show|shut|sing|sleep|smell|smile|spend|start|study|swim|talk|teach|throw|touch|travel|turn|visit|wake|wash|wear)\b/gi;
            // But only flag if it's clearly English context (not Swedish words that happen to match)
            // Check if the word appears in a context that suggests it's English
            const suspiciousEnglish = /\b(lately|maybe|perhaps|actually|really|nice|cool|awesome|yeah|ok|okay)\b/gi;
            if(suspiciousEnglish.test(translated)){
                console.warn(`[Nocturne] Found suspicious English words, replacing...`);
                // Try to fix common ones
                translated = translated.replace(/\blately\b/gi, 'nyligen');
                translated = translated.replace(/\bmaybe\b/gi, 'kanske');
                translated = translated.replace(/\bperhaps\b/gi, 'kanske');
                translated = translated.replace(/\bactually\b/gi, 'faktiskt');
                translated = translated.replace(/\breally\b/gi, 'verkligen');
                translated = translated.replace(/\bnice\b/gi, 'bra');
                translated = translated.replace(/\bcool\b/gi, 'schysst');
                translated = translated.replace(/\bawesome\b/gi, 'grymt');
                translated = translated.replace(/\byeah\b/gi, 'ja');
                translated = translated.replace(/\bok\b/gi, 'okej');
                translated = translated.replace(/\bokay\b/gi, 'okej');
            }
            
            // Filter: Minimum 160 characters (but allow some flexibility for translation)
            // Also check if reply seems incomplete (ends mid-sentence)
            if(translated.length < 150){  // Further reduced to 150 to be more lenient
                console.warn(`[Nocturne] REJECTED: Too short (${translated.length} chars < 150)`);
                return null;
            }
            
            // Check if reply seems incomplete (ends without punctuation or question mark)
            const trimmed = translated.trim();
            if(trimmed.length > 0 && !trimmed.match(/[.!?]$/)) {
                console.warn(`[Nocturne] WARNING: Reply may be incomplete (no ending punctuation): ${trimmed.substring(0, 50)}...`);
            }
            // Check for remaining English words (using pattern defined above at line 1370)
            if(englishWordPattern.test(translated)){
                console.warn(`[Nocturne] REJECTED: Contains English words`);
                // Try to fix common ones
                translated = translated.replace(/\blately\b/gi, 'nyligen');
                translated = translated.replace(/\bmaybe\b/gi, 'kanske');
                translated = translated.replace(/\bperhaps\b/gi, 'kanske');
                translated = translated.replace(/\bactually\b/gi, 'faktiskt');
                translated = translated.replace(/\breally\b/gi, 'verkligen');
                translated = translated.replace(/\bnice\b/gi, 'bra');
                translated = translated.replace(/\bcool\b/gi, 'schysst');
                translated = translated.replace(/\bawesome\b/gi, 'grymt');
                translated = translated.replace(/\byeah\b/gi, 'ja');
                translated = translated.replace(/\bok\b/gi, 'okej');
                translated = translated.replace(/\bokay\b/gi, 'okej');
                // Re-check after replacement
                if(englishWordPattern.test(translated)){
                    console.warn(`[Nocturne] Still contains English words after replacement, but keeping it`);
                }
            }
            
            return translated;
            }));
            
            swedishReplies.push(...batchTranslations);
        }
        
        // Filter out nulls
        const allSwedishReplies = swedishReplies.filter(r => r !== null);
        
        console.log('[Nocturne] Translated', allSwedishReplies.length, 'replies');
        
        // Filter out null replies (rejected during cleanup)
        const validReplies = allSwedishReplies.filter(r => r !== null && r.length >= 150 && r.includes('?'));  // Reduced to 150
        console.log(`[Nocturne] Valid replies after filtering: ${validReplies.length} (removed ${allSwedishReplies.length - validReplies.length})`);
        
        if(validReplies.length === 0){
            throw new Error('No valid replies after filtering (all were too short or missing question)');
        }

        // 6. Score with GPT-4o-mini
        console.log('[Nocturne] Scoring replies...');
        const contextText = sanitizedHistory.slice(0, -1).map(m => `${m.role === 'user' ? 'Han' : 'Jag'}: ${m.content}`).join('\n');
        const scored = await scoreRepliesWithGPT(validReplies, contextText, sanitizedLatestMessage);

        // 7. Filter and sort
        const passed = scored.filter(s => s.score >= scoreThreshold);
        console.log(`[Nocturne] Quality filter: ${scored.length} → ${passed.length} (threshold: ${scoreThreshold})`);

        let topReplies;
        if (generateCount === 1) {
            // For single reply regeneration, return the best one (even if below threshold)
            topReplies = scored.sort((a, b) => b.score - a.score).slice(0, 1);
            if (passed.length > 0) {
                topReplies = passed.sort((a, b) => b.score - a.score).slice(0, 1);
            }
        } else {
            // For multiple replies, return top 3
            if (passed.length === 0) {
                console.warn('[Nocturne] All replies rejected. Using top 3 anyway.');
                topReplies = scored.sort((a, b) => b.score - a.score).slice(0, 3);
            } else {
                topReplies = passed.sort((a, b) => b.score - a.score).slice(0, 3);
            }
        }

        // 8. Log for ML training (Phase 2)
        logScoringResult({
            latestMessage: sanitizedLatestMessage,
            historyLength: sanitizedHistory.length,
            generated: englishReplies.length,
            scored: scored.map(s => ({ score: s.score, length: s.text.length })),
            topScores: topReplies.map(s => s.score),
            threshold: scoreThreshold
        });

        // 9. Return results
        res.json({
            replies: topReplies.map(s => s.text),
            scores: topReplies.map(s => s.score),
            allScored: scored.map(s => ({ text: s.text.substring(0, 50) + '...', score: s.score })),
            meta: {
                generated: englishReplies.length,
                passed: passed.length,
                threshold: scoreThreshold,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Nocturne] Generate with scoring failed:', error);
        res.status(500).json({
            error: error.message,
            replies: []
        });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`GPT Relay Server running at http://localhost:${PORT}`);
  console.log(`OpenAI API Key ${OPENAI_API_KEY ? 'is configured' : 'is NOT configured'}`);
  console.log(`Allowed origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'all origins'}`);
  console.log(`History will store up to ${MAX_HISTORY_ITEMS} most recent conversations`);
  console.log(`Test UI available at http://localhost:${PORT}/test-prompt.html`);
  console.log(`Debug tool available at http://localhost:${PORT}/cors-debug.html`);
  
  // RunPod configuration status
  if (USE_RUNPOD) {
    console.log('🌐 RunPod Serverless: ENABLED');
    console.log(`   Endpoint: ${RUNPOD_ENDPOINT_URL ? RUNPOD_ENDPOINT_URL.substring(0, 50) + '...' : 'NOT SET'}`);
  } else {
    console.log('🌐 RunPod Serverless: DISABLED (using local Ollama)');
    if (RUNPOD_ENDPOINT_URL && RUNPOD_API_KEY) {
      console.log('   (Set USE_RUNPOD=true in .env to enable RunPod)');
    } else {
      console.log('   (Set RUNPOD_ENDPOINT_URL and RUNPOD_API_KEY in .env to enable)');
    }
  }
}); 