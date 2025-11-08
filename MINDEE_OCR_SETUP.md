# Mindee OCR Setup Guide

Mindee powers TipJar's production OCR pipeline. Follow the steps below to enable it
for local development, staging, or production environments.

## 1. Create a Mindee Account & API Key
1. Sign up at [Mindee](https://www.mindee.com/) (a free tier is available).
2. From the dashboard, open **API Keys** and create a key with access to the
   **Universal OCR** product.
3. Copy the generated API key – you'll use it for the `MINDEE_API_KEY`
   environment variable.

## 2. Configure Environment Variables
Update your environment configuration (`.env`, deployment secrets, etc.) with the
following values:

| Variable | Required? | Description | Example |
| --- | --- | --- | --- |
| `OCR_ENGINE` | Recommended | `auto`, `mindee`, or `tesseract` | `auto` |
| `MINDEE_API_KEY` | ✅ | Mindee API key | `md_xxxxxxxxxxxxxx` |
| `MINDEE_ENDPOINT` | Optional | Override the default Universal OCR endpoint | `https://api.mindee.net/v1/products/<account>/<model>/v1` |
| `MINDEE_MAX_RETRIES` | Optional | Number of retries for transient API errors | `3` |
| `MINDEE_TIMEOUT_MS` | Optional | Timeout per request | `30000` |
| `MINDEE_RETRY_DELAY_MS` | Optional | Delay between retries/polling | `1000` |

> 💡 The default endpoint is `https://api.mindee.net/v1/products/mindee/universal-ocr/v1`.
> Only set `MINDEE_ENDPOINT` if you use a custom model or region.

## 3. Test the Integration Locally
1. Place one or more Starbucks Tip Distribution Report images in
   `attached_assets/` (samples are included in the repository).
2. Load your environment variables (`cp env.example .env` and fill in values).
3. Run the Mindee test harness:
   ```bash
   npm run test:mindee
   ```
4. The script will report which OCR engine was used, confidence scores, and the
   extracted partner table. Make sure the Mindee engine succeeds before
   deploying.

5. Need to validate parsing against mocked Mindee payloads without calling the
   API? Run the unit test that exercises the normalization layer:
   ```bash
   npm run test:mindee:normalize
   ```
   This uses Node's built-in test runner and requires no external dependencies
   or credentials.

## 4. Debugging Mindee Output
Need to inspect Mindee's raw text? Use the dedicated debugger:
```bash
npm run debug:mindee
```
This prints the text returned by Mindee and the parsed partner data, which is
useful for tuning preprocessing or parsing rules.

## 5. Deployment Notes
- **Secrets management**: store `MINDEE_API_KEY` in your CI/CD secret store or
  hosting provider (Netlify, Vercel, etc.).
- **Auto mode**: `OCR_ENGINE=auto` will always try Mindee first and fall back to
  Tesseract if no structured data is extracted.
- **Logging**: Mindee responses include a job ID. Check server logs to correlate
  issues with Mindee's dashboard if troubleshooting is required.

That's it! Mindee OCR now powers TipJar's automatic extraction.
