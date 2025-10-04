# Gemini AI Setup Guide

## Overview

The Monity app now includes an AI Chat feature powered by Google's Gemini AI. This guide will help you configure the Gemini API integration.

## Getting Started

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API Key"
4. Create a new API key or use an existing one
5. Copy the API key

### 2. Configure the API Key

#### Option 1: Environment Variable (Recommended for Development)

Create a `.env` file in the `frontend/Monity` directory:

```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Option 2: Update app.json

1. Open `frontend/Monity/app.json`
2. Find the `extra` section
3. Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual API key:

```json
{
  "expo": {
    "extra": {
      "geminiApiKey": "your_actual_gemini_api_key_here"
    }
  }
}
```

### 3. Test the Integration

1. Start your development server:

   ```bash
   cd frontend/Monity
   npm start
   ```

2. Navigate to the "IA Chat" tab in the app
3. Send a test message like "Olá, como posso economizar mais dinheiro?"

### 4. Features

The AI Chat includes:

- **Real-time Chat**: Send messages and get AI responses
- **Financial Focus**: The AI is specifically trained to provide financial advice
- **Contextual Responses**: AI considers your financial situation for personalized advice
- **Fallback Mode**: Works even without API key (basic responses)
- **Portuguese Support**: All responses are in Brazilian Portuguese

### 5. API Usage & Limits

- Free tier includes 60 requests per day
- Paid tiers available for more usage
- Monitor your usage in [Google AI Studio](https://aistudio.google.com/)

### 6. Troubleshooting

#### "Gemini API key not configured" warning

- Make sure you've added the API key to your configuration
- Restart the development server after adding the key

#### Network errors

- Check your internet connection
- Verify your API key is valid
- Check the Google AI Studio dashboard for any issues

#### Fallback responses appearing

- This means the API key isn't configured or there's a network issue
- The chat will still work with basic responses

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Regularly rotate your API keys
- Monitor usage to prevent unexpected charges

## Customization

You can customize the AI's personality and responses by modifying the `geminiService.ts` file:

- Update the `systemPrompt` to change the AI's persona
- Modify the financial context provided to the AI
- Add more specific financial advice categories

## Support

For issues with:

- **Gemini API**: Check [Google AI Studio Documentation](https://ai.google.dev/docs)
- **Monity Integration**: Check the logs in the React Native debugger
- **App Configuration**: Review the setup steps above
