/**
 * Mindee OCR implementation
 * Uses Mindee's REST API to extract text content from uploaded documents.
 */

export interface MindeeOCRResult {
  text: string | null;
  confidence?: number;
  /**
   * Raw fields returned by Mindee's Universal OCR model. Exposed for
   * debugging downstream parsing issues and mirrors the SDK structure.
   */
  fields?: Array<Record<string, unknown>>;
  error?: string;
  jobId?: string;
}

const DEFAULT_MINDEE_ENDPOINT = 'https://api.mindee.net/v1/products/mindee/universal-ocr/v1';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Analyze an image using the Mindee OCR API
 * @param imageBuffer Buffer of the uploaded image
 * @returns Extracted text and confidence information
 */
export async function analyzeImageWithMindee(imageBuffer: Buffer): Promise<MindeeOCRResult> {
  const apiKey = process.env.MINDEE_API_KEY;

  if (!apiKey) {
    console.warn('Mindee OCR skipped: MINDEE_API_KEY is not configured.');
    return {
      text: null,
      error: 'Mindee API key not configured',
    };
  }

  const baseEndpoint = (process.env.MINDEE_ENDPOINT || DEFAULT_MINDEE_ENDPOINT).replace(/\/$/, '');
  const predictUrl = `${baseEndpoint}/predict`;

  const maxAttempts = Math.max(1, Number.parseInt(process.env.MINDEE_MAX_RETRIES || '3', 10));
  const timeoutMs = Math.max(5000, Number.parseInt(process.env.MINDEE_TIMEOUT_MS || '30000', 10));
  const retryDelayMs = Math.max(250, Number.parseInt(process.env.MINDEE_RETRY_DELAY_MS || '1000', 10));

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Mindee] Attempt ${attempt}/${maxAttempts}: sending document to ${predictUrl}`);

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'application/octet-stream' });
      formData.append('document', blob, `upload-${Date.now()}.png`);

      const response = await fetch(predictUrl, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      const rawBody = await response.text();
      let json: any;

      try {
        json = rawBody ? JSON.parse(rawBody) : undefined;
      } catch (parseError) {
        console.error('[Mindee] Failed to parse response JSON:', parseError);
        json = undefined;
      }

      if (!response.ok) {
        const status = response.status;
        console.error(`[Mindee] Request failed with status ${status}:`, json || rawBody);
        lastError = `Mindee OCR failed with status ${status}`;

        if (attempt < maxAttempts && RETRYABLE_STATUS_CODES.has(status)) {
          await delay(retryDelayMs * attempt);
          continue;
        }

        return {
          text: null,
          error: lastError,
          jobId: json?.job?.id || json?.document?.id,
        };
      }

      const jobStatus = json?.job?.status;
      const jobId = json?.document?.id || json?.job?.id;

      if (jobStatus && jobStatus !== 'completed' && jobId) {
        console.log(`[Mindee] Job ${jobId} returned status '${jobStatus}'. Polling for completion...`);
        const completed = await pollMindeeJob(baseEndpoint, apiKey, jobId, timeoutMs, retryDelayMs);
        if (!completed) {
          lastError = `Mindee job ${jobId} did not complete in time`;
          if (attempt < maxAttempts) {
            await delay(retryDelayMs * attempt);
            continue;
          }

          return {
            text: null,
            error: lastError,
            jobId,
          };
        }

        json = completed;
      }

      const { text, confidence, fields } = normalizeMindeeResponse(json);

      if (!text) {
        lastError = 'Mindee OCR returned no text';
        console.warn('[Mindee] No text extracted from response:', json);

        if (attempt < maxAttempts) {
          await delay(retryDelayMs * attempt);
          continue;
        }

        return {
          text: null,
          error: lastError,
          jobId,
        };
      }

      console.log(`[Mindee] OCR successful. Extracted ${text.length} characters with confidence ${confidence ?? 0}%`);

      return {
        text,
        confidence,
        fields,
        jobId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Mindee] Exception during OCR attempt ${attempt}:`, error);

      if (attempt < maxAttempts) {
        await delay(retryDelayMs * attempt);
        continue;
      }

      return {
        text: null,
        error: `Mindee OCR exception: ${lastError}`,
      };
    }
  }

  return {
    text: null,
    error: lastError || 'Mindee OCR failed to process the document',
  };
}

async function pollMindeeJob(
  baseEndpoint: string,
  apiKey: string,
  jobId: string,
  timeoutMs: number,
  retryDelayMs: number,
): Promise<any | null> {
  const documentUrl = `${baseEndpoint}/documents/${jobId}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(documentUrl, {
        method: 'GET',
        headers: {
          Authorization: `Token ${apiKey}`,
        },
      });

      const rawBody = await response.text();
      let json: any;

      try {
        json = rawBody ? JSON.parse(rawBody) : undefined;
      } catch (parseError) {
        console.error('[Mindee] Failed to parse polling response JSON:', parseError);
        json = undefined;
      }

      if (!response.ok) {
        console.error(`[Mindee] Polling request failed with status ${response.status}:`, json || rawBody);
        if (RETRYABLE_STATUS_CODES.has(response.status)) {
          await delay(retryDelayMs);
          continue;
        }
        return null;
      }

      const status = json?.job?.status;

      if (!status || status === 'completed') {
        return json;
      }

      if (status === 'failed') {
        console.error('[Mindee] Job failed during polling:', json);
        return null;
      }

      await delay(retryDelayMs);
    } catch (error) {
      console.error('[Mindee] Polling error:', error);
      await delay(retryDelayMs);
    }
  }

  return null;
}

export function normalizeMindeeResponse(
  data: any
): { text: string | null; confidence?: number; fields?: Array<Record<string, unknown>> } {
  if (!data) {
    return { text: null };
  }

  const inference = data.document?.inference ?? data.inference ?? data.document ?? data.prediction ?? data.result;

  if (!inference) {
    return { text: null };
  }

  const segments: string[] = [];
  const seenSegments = new Set<string>();
  const confidences: number[] = [];

  const pushSegment = (value: unknown) => {
    if (typeof value !== 'string') {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || seenSegments.has(trimmed)) {
      return;
    }

    seenSegments.add(trimmed);
    segments.push(trimmed);
  };

  const pushConfidence = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      confidences.push(normalizeConfidence(value));
    }
  };

  collectExplicitMindeeNodes(inference, pushSegment, pushConfidence);
  collectLooseMindeeNodes(inference, pushSegment, pushConfidence);

  const combinedText = segments.join('\n').trim();

  if (!combinedText) {
    return { text: null };
  }

  const confidence = confidences.length
    ? Math.round(
        Math.min(100, Math.max(0, confidences.reduce((sum, value) => sum + value, 0) / confidences.length))
      )
    : undefined;

  const fields = extractMindeeFields(inference);

  return { text: combinedText, confidence, fields };
}

type SegmentCollector = (value: unknown) => void;
type ConfidenceCollector = (value: unknown) => void;

function collectExplicitMindeeNodes(
  inference: any,
  pushSegment: SegmentCollector,
  pushConfidence: ConfidenceCollector,
) {
  const predictions = Array.isArray(inference?.pages)
    ? inference.pages
    : Array.isArray(inference?.prediction?.pages)
    ? inference.prediction.pages
    : undefined;

  if (Array.isArray(predictions)) {
    for (const page of predictions) {
      pushSegment(page?.prediction?.rawText ?? page?.prediction?.fullText ?? page?.prediction?.text ?? page?.rawText);
      pushConfidence(page?.prediction?.confidence ?? page?.confidence);

      collectLooseMindeeNodes(page?.prediction, pushSegment, pushConfidence);
      collectLooseMindeeNodes(page, pushSegment, pushConfidence);
    }
  }

  pushSegment(inference?.prediction?.rawText ?? inference?.prediction?.fullText ?? inference?.prediction?.text);
  pushSegment(inference?.rawText ?? inference?.fullText ?? inference?.text);
  pushConfidence(inference?.prediction?.confidence ?? inference?.confidence);
}

function collectLooseMindeeNodes(
  node: unknown,
  pushSegment: SegmentCollector,
  pushConfidence: ConfidenceCollector,
) {
  if (!node) {
    return;
  }

  if (typeof node === 'string') {
    pushSegment(node);
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectLooseMindeeNodes(item, pushSegment, pushConfidence);
    }
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (typeof value === 'string') {
      if (isLikelyTextKey(key)) {
        pushSegment(value);
      }
      continue;
    }

    if (typeof value === 'number' && key.toLowerCase().includes('confidence')) {
      pushConfidence(value);
      continue;
    }

    collectLooseMindeeNodes(value, pushSegment, pushConfidence);
  }
}

function isLikelyTextKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return (
    lowered.includes('text') ||
    lowered.includes('content') ||
    lowered.includes('raw') ||
    lowered.includes('value') ||
    lowered.includes('string') ||
    lowered.includes('words') ||
    lowered.includes('line')
  );
}

function extractMindeeFields(inference: any): Array<Record<string, unknown>> | undefined {
  const candidate =
    inference?.prediction?.fields ??
    inference?.fields ??
    inference?.document?.inference?.prediction?.fields ??
    inference?.result?.fields;

  if (!candidate) {
    return undefined;
  }

  const fields = Array.isArray(candidate) ? candidate : Object.values(candidate as Record<string, unknown>);

  return fields
    .map((field) => (typeof field === 'object' && field !== null ? (field as Record<string, unknown>) : undefined))
    .filter((field): field is Record<string, unknown> => Boolean(field));
}

function normalizeConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  if (value <= 1) {
    return value * 100;
  }

  return value;
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

