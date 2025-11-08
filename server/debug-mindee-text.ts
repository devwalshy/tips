/**
 * Debug what Mindee is actually extracting
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImageWithMindee } from './api/mindeeOcr';
import { parseStarbucksReport } from './lib/tableParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugMindee() {
  const assetsDir = path.join(__dirname, '..', 'attached_assets');
  const imageFiles = fs.readdirSync(assetsDir)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .filter(file => file.includes('report'));
  
  if (imageFiles.length === 0) {
    console.log('No report images found in attached_assets/');
    return;
  }
  
  const imagePath = path.join(assetsDir, imageFiles[0]);
  const imageBuffer = fs.readFileSync(imagePath);
  
  console.log(`Testing with: ${imageFiles[0]}\n`);
  console.log('='.repeat(70));
  
  const result = await analyzeImageWithMindee(imageBuffer);

  if (result.text) {
    if (result.jobId) {
      console.log(`Mindee Job ID: ${result.jobId}\n`);
    }
    console.log('MINDEE OCR TEXT:');
    console.log('='.repeat(70));
    console.log(result.text);
    console.log('='.repeat(70));
    console.log(`\nLength: ${result.text.length} characters`);

    if (result.fields?.length) {
      console.log('\nMindee Fields Summary:');
      result.fields.slice(0, 5).forEach((field, index) => {
        const record = field as Record<string, unknown>;
        const name = typeof record.name === 'string' ? record.name : `field_${index + 1}`;
        const valueCandidate = record.value ?? record.content ?? record.text ?? '';
        const value = typeof valueCandidate === 'string' ? valueCandidate : JSON.stringify(valueCandidate);
        const confidence =
          typeof record.confidence === 'number'
            ? `${Math.round(normalizeFieldConfidence(record.confidence))}%`
            : 'n/a';
        console.log(`  - ${name}: ${value} (confidence ${confidence})`);
      });

      if (result.fields.length > 5) {
        console.log(`  ...and ${result.fields.length - 5} more fields`);
      }
    }

    console.log('\n\nPARSING RESULT:');
    console.log('='.repeat(70));
    const parsed = parseStarbucksReport(result.text);
    console.log(`Partners found: ${parsed.partners.length}`);
    console.log(`Confidence: ${parsed.confidence}%`);
    
    if (parsed.partners.length > 0) {
      console.log('\nPartners:');
      parsed.partners.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}: ${p.hours} hours`);
      });
    }
  } else {
    console.log('Error:', result.error);
  }
}

debugMindee().catch(console.error);

function normalizeFieldConfidence(confidence: unknown): number {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return 0;
  }

  return confidence <= 1 ? confidence * 100 : confidence;
}

