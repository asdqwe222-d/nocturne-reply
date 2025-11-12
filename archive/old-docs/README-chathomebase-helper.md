# GPT Relay Server

A simple Node.js server that relays requests to OpenAI's API for use with the ChatHomebase Helper Tampermonkey script.

## Setup

1. Ensure you have [Node.js](https://nodejs.org/) installed (version 14 or higher recommended).

2. Clone or download this repository.

3. Install dependencies:
   ```
   cd gpt-relay-server
   npm install
   ```

4. Configure environment variables:
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Add your OpenAI API key to the `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```
   - You can get an API key from [OpenAI's platform](https://platform.openai.com/account/api-keys)

5. Start the server:
   ```
   npm start
   ```

6. The server will run at http://localhost:3000 by default.

## Connecting with Tampermonkey Script

1. Make sure your ChatHomebase Helper Tampermonkey script is configured to use this server:
   ```javascript
   const config = {
     // Change this to match your server
     gptEndpoint: 'http://localhost:3000/generate',
     // ...other config options
   };
   ```

2. For testing without an OpenAI API key, you can use the mock endpoint:
   ```javascript
   const config = {
     gptEndpoint: 'http://localhost:3000/mock-generate',
     // ...other config options
   };
   ```

## API Endpoints

- `GET /` - Health check endpoint
- `POST /generate` - Main endpoint for generating responses using OpenAI API
- `POST /mock-generate` - Mock endpoint for testing without OpenAI API

## Troubleshooting

### CORS Issues
- If you see CORS errors in the browser console, check that your server's `ALLOWED_ORIGINS` includes chathomebase.com or modify to allow all origins.

### Connection Refused
- Ensure the server is running
- Verify that the port matches what's in the Tampermonkey script
- Check if any firewall is blocking the connection

### API Key Issues
- If you see "OpenAI API key not configured" errors, make sure you've added your API key to the `.env` file
- Verify that the API key is valid and has not expired

## License

MIT

