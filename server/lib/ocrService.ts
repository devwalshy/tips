/**
 * OCR Service - Abstraction layer for multiple OCR engines
 * Supports: Mindee OCR (primary) and Tesseract (fallback)
 */

import { analyzeImageWithMindee } from '../api/mindeeOcr';
import { parseStarbucksReport } from './tableParser';
import { preprocessImage } from './imagePreprocessor';
import { performOCRDetailed } from './ocrConfig';

export type OCREngine = 'mindee' | 'tesseract' | 'auto';

interface OCRServiceResult {
  text: string | null;
  partnerData: Array<{ name: string; hours: number }>;
  confidence: number;
  engine: string;
  error?: string;
  jobId?: string;
  fields?: Array<Record<string, unknown>>;
}

/**
 * Analyze image using the configured OCR engine
 * @param imageBuffer Image buffer to analyze
 * @param preferredEngine Preferred OCR engine (defaults to env var or 'auto')
 * @returns OCR result with partner data
 */
export async function analyzeImageWithService(
  imageBuffer: Buffer,
  preferredEngine?: OCREngine
): Promise<OCRServiceResult> {
  const envEngine = (process.env.OCR_ENGINE as OCREngine | undefined) || 'auto';
  const engine = preferredEngine || envEngine;

  console.log(`OCR Service: Using engine strategy '${engine}'`);

  if (engine === 'auto') {
    return await tryAutoMode(imageBuffer);
  }

  if (engine === 'mindee') {
    return await tryMindee(imageBuffer);
  }

  if (engine === 'tesseract') {
    return await tryTesseract(imageBuffer);
  }

  return await tryTesseract(imageBuffer);
}

/**
 * Auto mode: Try Mindee first, fallback to Tesseract
 */
async function tryAutoMode(imageBuffer: Buffer): Promise<OCRServiceResult> {
  console.log('Auto mode: Trying Mindee first...');

  const mindeeResult = await tryMindee(imageBuffer);

  if (mindeeResult.partnerData.length > 0 && mindeeResult.confidence >= 15) {
    console.log(`Auto mode: Mindee succeeded with confidence ${mindeeResult.confidence}%`);
    return mindeeResult;
  }

  console.log('Auto mode: Mindee confidence low or failed, trying Tesseract...');
  const tesseractResult = await tryTesseract(imageBuffer);

  if (tesseractResult.confidence > mindeeResult.confidence) {
    console.log(`Auto mode: Tesseract won with confidence ${tesseractResult.confidence}%`);
    return tesseractResult;
  }

  console.log(`Auto mode: Using Mindee result with confidence ${mindeeResult.confidence}%`);
  return mindeeResult;
}

/**
 * Try Mindee OCR
 */
async function tryMindee(imageBuffer: Buffer): Promise<OCRServiceResult> {
  try {
    const result = await analyzeImageWithMindee(imageBuffer);

    if (!result.text || result.error) {
      return {
        text: null,
        partnerData: [],
        confidence: 0,
        engine: 'mindee',
        error: result.error || 'Mindee OCR failed',
        jobId: result.jobId,
        fields: result.fields,
      };
    }

    if (result.jobId) {
      console.log(`[Mindee] Job ID: ${result.jobId}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`MINDEE OCR TEXT (${result.text.length} characters):`);
    console.log('='.repeat(80));
    console.log(result.text);
    console.log('='.repeat(80));

    const parseResult = parseStarbucksReport(result.text);

    console.log(`Mindee parser found ${parseResult.partners.length} partners with ${parseResult.confidence}% confidence`);

    if (parseResult.partners.length > 0) {
      console.log(`Accepting Mindee result with ${parseResult.partners.length} partners`);
      return {
        text: result.text,
        partnerData: parseResult.partners,
        confidence: parseResult.confidence,
        engine: 'mindee',
        jobId: result.jobId,
        fields: result.fields,
      };
    }

    return {
      text: result.text,
      partnerData: [],
      confidence: parseResult.confidence,
      engine: 'mindee',
      error: 'No partners found in Mindee text',
      jobId: result.jobId,
      fields: result.fields,
    };

  } catch (error) {
    console.error('Mindee OCR error:', error);
    return {
      text: null,
      partnerData: [],
      confidence: 0,
      engine: 'mindee',
      error: `Mindee exception: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Try Tesseract OCR
 */
async function tryTesseract(imageBuffer: Buffer): Promise<OCRServiceResult> {
  try {
    const processedBuffer = await preprocessImage(imageBuffer);
    const detailed = await performOCRDetailed(processedBuffer);

    if (!detailed.text || !detailed.text.trim()) {
      return {
        text: detailed.text ?? null,
        partnerData: [],
        confidence: 0,
        engine: 'tesseract',
        error: 'Tesseract OCR returned no text'
      };
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`TESSERACT OCR TEXT (${detailed.text.length} characters):`);
    console.log('='.repeat(80));
    console.log(detailed.text);
    console.log('='.repeat(80));

    const parseResult = parseStarbucksReport(detailed.text);

    if (parseResult.partners.length === 0) {
      return {
        text: detailed.text,
        partnerData: [],
        confidence: parseResult.confidence || Math.round(detailed.confidence ?? 0),
        engine: 'tesseract',
        error: 'No partners found in Tesseract text'
      };
    }

    return {
      text: detailed.text,
      partnerData: parseResult.partners,
      confidence: parseResult.confidence || Math.round(detailed.confidence ?? 0),
      engine: 'tesseract'
    };

  } catch (error) {
    console.error('Tesseract OCR error:', error);
    return {
      text: null,
      partnerData: [],
      confidence: 0,
      engine: 'tesseract',
      error: `Tesseract exception: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
}
