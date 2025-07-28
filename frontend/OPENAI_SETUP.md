# 🔑 OpenAI Integration Setup Guide

## Environment Variable Setup (Recommended)

### Step 1: Get Your OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-`)

### Step 2: Create Environment File
Create a `.env.local` file in your project root:

```bash
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your_actual_api_key_here

# Optional configurations
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=500
```

### Step 3: Restart Development Server
```bash
npm run dev
```

## Alternative: Browser Storage
If you prefer not to use environment variables, you can configure the API key through the UI:

1. Open the application at `http://localhost:5173`
2. Look for the "OpenAI Configuration" panel
3. Click "Show Config"
4. Enter your API key
5. Click "Save Configuration"

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key | Required |
| `VITE_OPENAI_MODEL` | GPT model to use | `gpt-3.5-turbo` |
| `VITE_OPENAI_MAX_TOKENS` | Maximum response length | `500` |

## Security Notes

- ⚠️ **Important**: Never commit your `.env.local` file to version control
- 🔒 The `.env.local` file is automatically ignored by git
- 🛡️ Environment variables are the most secure way to store API keys
- 🌐 In production, always use backend proxy instead of browser-side API calls

## Troubleshooting

### API Key Not Working
- Ensure your API key starts with `sk-`
- Check that you have sufficient OpenAI credits
- Verify the key is correctly set in `.env.local`

### Environment Variables Not Loading
- Make sure the file is named `.env.local` exactly
- Restart the development server after creating the file
- Check the browser console for configuration logs

### Fallback Mode
If OpenAI is not configured, the app will automatically use demo responses. You'll see a "Demo" badge instead of "OpenAI" in the response generator.

## Cost Considerations

- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Typical interview response: 50-200 tokens
- Set `VITE_OPENAI_MAX_TOKENS` to control costs
- Monitor usage in OpenAI dashboard

## Example .env.local File

```bash
# Required: Your OpenAI API key
VITE_OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890

# Optional: Choose your model
VITE_OPENAI_MODEL=gpt-3.5-turbo

# Optional: Limit response length (saves costs)
VITE_OPENAI_MAX_TOKENS=300

# Optional: Control response creativity (0.0-2.0)
VITE_OPENAI_TEMPERATURE=0.7
```