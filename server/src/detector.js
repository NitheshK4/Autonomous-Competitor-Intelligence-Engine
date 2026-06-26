const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { env, pipeline } = require('@huggingface/transformers');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
env.cacheDir = CACHE_DIR;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const LOCAL_MODEL_DIR = path.join(CACHE_DIR, 'Xenova', 'all-MiniLM-L6-v2');
const ONNX_DIR = path.join(LOCAL_MODEL_DIR, 'onnx');

// List of required model files to fetch from HF
const FILES_TO_DOWNLOAD = [
  { name: 'config.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/config.json', destDir: LOCAL_MODEL_DIR },
  { name: 'tokenizer.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json', destDir: LOCAL_MODEL_DIR },
  { name: 'tokenizer_config.json', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer_config.json', destDir: LOCAL_MODEL_DIR },
  { name: 'model.onnx', url: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx', destDir: ONNX_DIR }
];

async function ensureEmbeddingModel() {
  if (!fs.existsSync(LOCAL_MODEL_DIR)) fs.mkdirSync(LOCAL_MODEL_DIR, { recursive: true });
  if (!fs.existsSync(ONNX_DIR)) fs.mkdirSync(ONNX_DIR, { recursive: true });

  for (const file of FILES_TO_DOWNLOAD) {
    const filePath = path.join(file.destDir, file.name);
    
    // If file doesn't exist or is empty, download it manually
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
      console.log(`Downloading embedding file: ${file.name}...`);
      
      const tempPath = filePath + '.tmp';
      const writer = fs.createWriteStream(tempPath);
      
      const response = await axios({
        url: file.url,
        method: 'GET',
        responseType: 'stream',
        timeout: 60000
      });
      
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      fs.renameSync(tempPath, filePath);
      console.log(`Successfully downloaded: ${file.name}`);
    }
  }
}

let embedPipeline = null;
let modelInitPromise = null;

// Dynamically load HuggingFace transformers pipeline with concurrency safety
async function getPipeline() {
  if (embedPipeline) return embedPipeline;
  
  if (!modelInitPromise) {
    modelInitPromise = (async () => {
      await ensureEmbeddingModel();
      embedPipeline = await pipeline('feature-extraction', MODEL_NAME);
    })();
  }
  
  await modelInitPromise;
  return embedPipeline;
}

// Compute dot product of two vectors (cosine similarity since vectors are normalized)
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

async function getEmbedding(text) {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Splits text into semantic chunks (paragraphs)
function getChunks(text) {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 10); // Ignore tiny fragments
}

/**
 * Compare two text versions semantically chunk-by-chunk.
 * Returns { hasChanged, similarity, diffText, changesSummary }
 */
async function detectChanges(oldText, newText, threshold = 0.85) {
  if (!oldText) {
    // Brand new competitor, treat all chunks as new
    const newChunks = getChunks(newText);
    return {
      hasChanged: newChunks.length > 0,
      similarity: 0.0,
      diffText: newChunks.map(c => `+ ${c}`).join('\n'),
      addedChunks: newChunks,
      removedChunks: []
    };
  }

  const oldChunks = getChunks(oldText);
  const newChunks = getChunks(newText);

  if (oldChunks.length === 0 && newChunks.length === 0) {
    return { hasChanged: false, similarity: 1.0, diffText: '', addedChunks: [], removedChunks: [] };
  }

  // If one of them is empty, it's a massive change
  if (oldChunks.length === 0 || newChunks.length === 0) {
    return {
      hasChanged: true,
      similarity: 0.0,
      diffText: newChunks.map(c => `+ ${c}`).join('\n') + '\n' + oldChunks.map(c => `- ${c}`).join('\n'),
      addedChunks: newChunks,
      removedChunks: oldChunks
    };
  }

  // Embed all chunks
  const oldEmbeddings = await Promise.all(oldChunks.map(async c => ({ text: c, vector: await getEmbedding(c) })));
  const newEmbeddings = await Promise.all(newChunks.map(async c => ({ text: c, vector: await getEmbedding(c) })));

  const addedChunks = [];
  const matchedOldIndices = new Set();
  const diffLines = [];

  // Find added or significantly changed paragraphs
  for (const newChunk of newEmbeddings) {
    let bestMatchScore = -1;
    let bestMatchIndex = -1;

    for (let i = 0; i < oldEmbeddings.length; i++) {
      const score = cosineSimilarity(newChunk.vector, oldEmbeddings[i].vector);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchIndex = i;
      }
    }

    // If similarity is below the threshold, this is a new/modified chunk
    if (bestMatchScore < threshold) {
      addedChunks.push(newChunk.text);
      diffLines.push(`+ ${newChunk.text}`);
    } else {
      matchedOldIndices.add(bestMatchIndex);
    }
  }

  // Find deleted paragraphs
  const removedChunks = [];
  for (let i = 0; i < oldEmbeddings.length; i++) {
    if (!matchedOldIndices.has(i)) {
      removedChunks.push(oldEmbeddings[i].text);
      diffLines.push(`- ${oldEmbeddings[i].text}`);
    }
  }

  // Calculate overall page similarity using average of best matches
  let totalMatchScore = 0;
  let matchCount = 0;
  
  for (const newChunk of newEmbeddings) {
    let maxScore = 0;
    for (const oldChunk of oldEmbeddings) {
      const score = cosineSimilarity(newChunk.vector, oldChunk.vector);
      if (score > maxScore) maxScore = score;
    }
    totalMatchScore += maxScore;
    matchCount++;
  }

  const overallSimilarity = matchCount > 0 ? (totalMatchScore / matchCount) : 0.0;
  const hasChanged = addedChunks.length > 0 || removedChunks.length > 0;

  return {
    hasChanged,
    similarity: overallSimilarity,
    diffText: diffLines.join('\n'),
    addedChunks,
    removedChunks
  };
}

module.exports = {
  getEmbedding,
  detectChanges,
  cosineSimilarity
};
