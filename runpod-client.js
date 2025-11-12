/**
 * RunPod Serverless Client
 * Handles communication with RunPod Serverless endpoints
 */

const fetch = require('node-fetch');

/**
 * Call RunPod Serverless endpoint for Ollama inference
 * @param {string} endpointUrl - RunPod Serverless endpoint URL
 * @param {string} apiKey - RunPod API key
 * @param {string} model - Model name (e.g., 'nocturne-swe')
 * @param {string} prompt - Generation prompt
 * @param {string} systemPrompt - System prompt
 * @param {object} options - Ollama options (temperature, top_p, etc.)
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<{response: string, error?: string}>}
 */
async function callRunPodServerless(endpointUrl, apiKey, model, prompt, systemPrompt, options = {}, timeout = 120000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        // RunPod Serverless expects a specific format
        // The endpoint should be configured to run Ollama
        const requestBody = {
            input: {
                model: model,
                prompt: prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.85,
                    top_p: options.top_p || 0.9,
                    repeat_penalty: options.repeat_penalty || 1.3,
                    num_ctx: options.num_ctx || 4096,
                    num_predict: options.num_predict || 600
                }
            }
        };

        console.log('[RunPod] Calling serverless endpoint:', endpointUrl);
        console.log('[RunPod] Model:', model);
        console.log('[RunPod] Prompt length:', prompt.length);

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[RunPod] API error:', response.status, errorText);
            throw new Error(`RunPod API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // RunPod Serverless returns data in different formats depending on configuration
        // Check for common response formats
        let responseText = '';
        
        if (data.output && typeof data.output === 'string') {
            // Direct string output
            responseText = data.output;
        } else if (data.output && data.output.response) {
            // Ollama-style response
            responseText = data.output.response;
        } else if (data.output && Array.isArray(data.output)) {
            // Array of outputs
            responseText = data.output.map(o => o.response || o.text || o).join('\n');
        } else if (data.response) {
            // Direct response field
            responseText = data.response;
        } else if (data.text) {
            // Text field
            responseText = data.text;
        } else {
            console.warn('[RunPod] Unexpected response format:', JSON.stringify(data).substring(0, 200));
            // Try to extract any text from the response
            responseText = JSON.stringify(data);
        }

        if (!responseText || responseText.trim().length === 0) {
            throw new Error('RunPod returned empty response');
        }

        console.log('[RunPod] Response received, length:', responseText.length);
        return { response: responseText };

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('RunPod request timeout');
        }
        
        console.error('[RunPod] Error:', error.message);
        throw error;
    }
}

/**
 * Check if RunPod endpoint is available
 * @param {string} endpointUrl - RunPod Serverless endpoint URL
 * @param {string} apiKey - RunPod API key
 * @returns {Promise<boolean>}
 */
async function checkRunPodHealth(endpointUrl, apiKey) {
    try {
        // Some RunPod endpoints support health checks
        // This is a simple check - adjust based on your endpoint configuration
        const response = await fetch(endpointUrl.replace('/run', '/health'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            signal: AbortSignal.timeout(5000)
        });
        
        return response.ok;
    } catch (error) {
        // If health check fails, endpoint might still work
        // Return true to allow attempts
        console.warn('[RunPod] Health check failed:', error.message);
        return true;
    }
}

module.exports = {
    callRunPodServerless,
    checkRunPodHealth
};

