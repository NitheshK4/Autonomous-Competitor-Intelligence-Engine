const path = require('path');
const fs = require('fs');
const fsSync = fs;
const { spawn, execSync } = require('child_process');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const BIN_DIR = path.join(__dirname, '..', 'bin');
const DATA_DIR = path.join(__dirname, '..', 'data');
const LLAMA_PATH_FILE = path.join(BIN_DIR, 'llama-cli-path.txt');
const MODEL_PATH = path.join(DATA_DIR, 'qwen2.5-0.5b-instruct-q4_k_m.gguf');
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';

// Ensure directories exist
if (!fsSync.existsSync(BIN_DIR)) fsSync.mkdirSync(BIN_DIR, { recursive: true });
if (!fsSync.existsSync(DATA_DIR)) fsSync.mkdirSync(DATA_DIR, { recursive: true });

// Helper to get cached llama-cli path
function getStoredLlamaPath() {
  if (fsSync.existsSync(LLAMA_PATH_FILE)) {
    const resolvedPath = fsSync.readFileSync(LLAMA_PATH_FILE, 'utf-8').trim();
    if (fsSync.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  return null;
}

// Download llama-cli binary dynamically from GitHub releases
async function downloadLlamaCli() {
  const cachedPath = getStoredLlamaPath();
  if (cachedPath) {
    return cachedPath;
  }

  console.log('Downloading llama-cli binary...');
  try {
    // Query Github API for latest release
    const releaseRes = await axios.get('https://api.github.com/repos/ggml-org/llama.cpp/releases/latest', {
      headers: { 'User-Agent': 'acie-installer' }
    });
    
    const assets = releaseRes.data.assets;
    let targetAsset = null;
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin') {
      const matchKey = arch === 'arm64' ? 'bin-macos-arm64.tar.gz' : 'bin-macos-x64.tar.gz';
      targetAsset = assets.find(a => a.name.includes(matchKey));
    } else if (platform === 'linux') {
      // Look for standard ubuntu or linux x64 binary
      targetAsset = assets.find(a => a.name.includes('bin-ubuntu-x64.tar.gz') || a.name.includes('bin-linux-x64.tar.gz'));
    }

    if (!targetAsset) {
      // Fallback to a stable tag if latest query fails to find suitable prebuilt asset
      console.log('Could not find platform asset in latest release, falling back to build b3600...');
      const fallbackBuild = 'b3600';
      const fileExt = platform === 'darwin' ? (arch === 'arm64' ? 'macos-arm64.tar.gz' : 'macos-x64.tar.gz') : 'ubuntu-x64.tar.gz';
      const downloadUrl = `https://github.com/ggml-org/llama.cpp/releases/download/${fallbackBuild}/llama-${fallbackBuild}-bin-${fileExt}`;
      return await downloadAndExtract(downloadUrl, platform);
    }

    console.log(`Found asset: ${targetAsset.name}. Downloading...`);
    return await downloadAndExtract(targetAsset.browser_download_url, platform);
  } catch (err) {
    console.error('Failed to download llama-cli dynamically:', err.message);
    throw err;
  }
}

async function downloadAndExtract(url, platform) {
  const tempFile = path.join(BIN_DIR, 'llama_temp.tar.gz');
  const writer = fsSync.createWriteStream(tempFile);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('Extracting archive...');
  try {
    // Standard extraction via tar utility (preserves symlinks on disk)
    execSync(`tar -xzf "${tempFile}" -C "${BIN_DIR}"`);
    
    let resolvedCliPath = '';

    // Recursively scan BIN_DIR for llama-cli
    const scanDir = (dir) => {
      const entries = fsSync.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          if (entry.name === 'llama-cli') {
            resolvedCliPath = fullPath;
            break;
          }
        }
      }
    };

    scanDir(BIN_DIR);

    if (!resolvedCliPath || !fsSync.existsSync(resolvedCliPath)) {
      throw new Error('llama-cli executable not found in extracted contents.');
    }

    // Make executable
    fsSync.chmodSync(resolvedCliPath, '755');
    
    // Also chmod any other binaries in the same folder if present
    try {
      const parentDir = path.dirname(resolvedCliPath);
      const siblingFiles = fsSync.readdirSync(parentDir);
      for (const file of siblingFiles) {
        const siblingPath = path.join(parentDir, file);
        const stat = fsSync.statSync(siblingPath);
        if (stat.isFile() && (file.startsWith('llama-') || file.endsWith('.dylib') || file.endsWith('.so'))) {
          fsSync.chmodSync(siblingPath, '755');
        }
      }
    } catch (e) {}

    // Save path
    fsSync.writeFileSync(LLAMA_PATH_FILE, resolvedCliPath, 'utf-8');
    console.log(`llama-cli binary and libraries registered at: ${resolvedCliPath}`);

    // Cleanup temp zip
    try {
      fsSync.unlinkSync(tempFile);
    } catch (e) {}

    return resolvedCliPath;
  } catch (err) {
    console.error('Extraction failed:', err.message);
    throw err;
  }
}

// Download GGUF Model
async function downloadModel() {
  if (fs.existsSync(MODEL_PATH)) {
    return MODEL_PATH;
  }

  console.log('Downloading Qwen2.5-0.5B GGUF model (~382MB) from Hugging Face...');
  const writer = fs.createWriteStream(MODEL_PATH);
  
  const response = await axios({
    url: MODEL_URL,
    method: 'GET',
    responseType: 'stream'
  });

  // Track progress
  let downloadedBytes = 0;
  const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
  
  response.data.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (totalBytes > 0 && downloadedBytes % (10 * 1024 * 1024) < chunk.length) {
      const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
      console.log(`Download progress: ${pct}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
    }
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('Model download complete.');
  return MODEL_PATH;
}

// Helper to extract tagged blocks from LLM response
function extractTag(text, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Call the Python Zero-Shot classification script as a subprocess.
 */
async function classifyChangeZeroShot(text) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'zero_shot_classifier.py');
    const child = spawn('python3', [pythonScript]);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Zero-shot classifier process exited with code ${code}. Stderr: ${stderrData}`));
      }
      try {
        const result = JSON.parse(stdoutData.trim());
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result.category.toLowerCase().trim());
      } catch (err) {
        reject(new Error(`Failed to parse Zero-shot classifier stdout: ${stdoutData}. Error: ${err.message}`));
      }
    });

    child.stdin.write(JSON.stringify({ text }));
    child.stdin.end();
  });
}

// Main analysis runner
async function analyzeChange(diffText, businessProfile) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    console.log('Using Google Gemini API for inference...');
    const startTime = Date.now();
    try {
      const systemPrompt = `You are a Competitor Intelligence Analyst. Your task is to analyze a detected change on a competitor's website, classify it, and score its business impact relative to our own business profile.
Always respond using the following XML tags:
<category>Select one: pricing change, product or feature update, hiring signal, content or messaging shift, leadership or company change, other</category>
<summary>A one-paragraph plain-English summary of what changed.</summary>
<why_it_matters>A one-paragraph plain-English explanation of why this change matters to our business.</why_it_matters>
<score>An integer from 1 to 10 representing the business threat/impact score</score>
<justification>A brief justification for the impact score relative to our business context</justification>
<recommendation>A brief recommended action for our business (e.g. "Consider a pricing response within 30 days" or "Monitor hiring in this area for the next quarter")</recommendation>`;

      const profileContext = businessProfile ? `
Our Business Name: ${businessProfile.business_name || 'Our Company'}
What our product does: ${businessProfile.product_desc || 'General Software Services'}
Who our customers are: ${businessProfile.customers || 'General Businesses'}
Our pricing/price point: ${businessProfile.price_point || 'Not specified'}
` : 'No specific business profile context is available.';

      const userPrompt = `
Here is our business profile for context:
${profileContext}

Here is the diff of the competitor's website content (+ indicates added lines, - indicates removed lines):
\`\`\`diff
${diffText}
\`\`\`

Analyze the competitor's changes above and generate the classified intelligence card. Keep your responses strictly inside the requested XML tags.`;

      const prompt = `${systemPrompt}\n\n${userPrompt}`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`Gemini API responded in ${duration}s.`);

      const category = extractTag(text, 'category').toLowerCase().trim() || 'other';
      const summary = extractTag(text, 'summary');
      const whyItMatters = extractTag(text, 'why_it_matters');
      const scoreText = extractTag(text, 'score');
      const justification = extractTag(text, 'justification');
      const recommendation = extractTag(text, 'recommendation');

      const parsedScore = parseInt(scoreText.match(/\d+/)?.[0] || '1', 10);
      const impact_score = Math.min(Math.max(parsedScore, 1), 10);

      // Run Python zero-shot classification as required by the assignment
      let finalCategory = 'other';
      try {
        const summaryForClassification = summary || diffText;
        const zeroShotCat = await classifyChangeZeroShot(summaryForClassification);
        
        const categoryMapping = {
          'pricing change': 'pricing change',
          'feature update': 'product or feature update',
          'hiring signal': 'hiring signal',
          'content shift': 'content or messaging shift',
          'leadership change': 'leadership or company change',
          'other': 'other'
        };
        finalCategory = categoryMapping[zeroShotCat] || 'other';
      } catch (e) {
        console.warn('Zero-shot classifier failed, falling back to LLM tag category:', e.message);
        const validCategories = [
          'pricing change',
          'product or feature update',
          'hiring signal',
          'content or messaging shift',
          'leadership or company change',
          'other'
        ];
        finalCategory = validCategories.includes(category) ? category : 'other';
      }

      return {
        category: finalCategory,
        summary: `${summary}\n\nWhy it matters: ${whyItMatters}`,
        impact_score,
        justification,
        recommendation,
        inferenceTime: parseFloat(duration)
      };
    } catch (err) {
      console.error('Gemini API request failed, falling back to local llama-cli:', err.message);
    }
  }

  // If we are on Railway or other memory-constrained cloud environments, running a local model will crash the container
  const isCloudEnv = !!(process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);
  if (isCloudEnv) {
    throw new Error('Local Qwen model inference is disabled in cloud environments to prevent Out-Of-Memory crashes. Please configure the GEMINI_API_KEY environment variable in your deployment settings.');
  }

  const llamaPath = await downloadLlamaCli();
  await downloadModel();

  const profileContext = businessProfile ? `
Our Business Name: ${businessProfile.business_name || 'Our Company'}
What our product does: ${businessProfile.product_desc || 'General Software Services'}
Who our customers are: ${businessProfile.customers || 'General Businesses'}
Our pricing/price point: ${businessProfile.price_point || 'Not specified'}
` : 'No specific business profile context is available.';

  // Format system prompt and instruction
  const systemPrompt = `You are a Competitor Intelligence Analyst. Your task is to analyze a detected change on a competitor's website, classify it, and score its business impact relative to our own business profile.
Always respond using the following XML tags:
<category>Select one: pricing change, product or feature update, hiring signal, content or messaging shift, leadership or company change, other</category>
<summary>A one-paragraph plain-English summary of what changed.</summary>
<why_it_matters>A one-paragraph plain-English explanation of why this change matters to our business.</why_it_matters>
<score>An integer from 1 to 10 representing the business threat/impact score</score>
<justification>A brief justification for the impact score relative to our business context</justification>
<recommendation>A brief recommended action for our business (e.g. "Consider a pricing response within 30 days" or "Monitor hiring in this area for the next quarter")</recommendation>`;

  const userPrompt = `
Here is our business profile for context:
${profileContext}

Here is the diff of the competitor's website content (+ indicates added lines, - indicates removed lines):
\`\`\`diff
${diffText}
\`\`\`

Analyze the competitor's changes above and generate the classified intelligence card. Keep your responses strictly inside the requested XML tags.`;

  // Format using Qwen Chat Template
  const formattedPrompt = `<|im_start|>system
${systemPrompt}<|im_end|>
<|im_start|>user
${userPrompt}<|im_end|>
<|im_start|>assistant
`;

  // Write prompt to a temp file to avoid CLI argument limits and shell injection
  const tempPromptFile = path.join(DATA_DIR, `prompt_${Date.now()}.txt`);
  fs.writeFileSync(tempPromptFile, formattedPrompt, 'utf-8');

  return new Promise((resolve, reject) => {
    console.log('Spawning llama-cli for inference...');
    const startTime = Date.now();

    // Spawn llama-cli process with optimized flags for CPU
    // -c 1024: context size
    // -n 512: max generated tokens
    // --temp 0.2: low temperature for consistent output structure
    const child = spawn(llamaPath, [
      '-m', MODEL_PATH,
      '-f', tempPromptFile,
      '-c', '1024',
      '-n', '512',
      '--temp', '0.2',
      '--threads', '2', // Run on 2 threads to be safe with Railway free CPUs
      '--log-disable',
      '--no-conversation', // Prevent chat-template REPL mode
      '--single-turn'      // Exit after generating output
    ]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', async (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`llama-cli process exited with code ${code} in ${duration}s`);
      
      // Cleanup temp prompt file
      try {
        fs.unlinkSync(tempPromptFile);
      } catch (e) {}

      if (code !== 0) {
        return reject(new Error(`LLM inference failed with code ${code}. Stderr: ${stderr}`));
      }

      // Parse structured tags
      const category = extractTag(stdout, 'category').toLowerCase().trim() || 'other';
      const summary = extractTag(stdout, 'summary');
      const whyItMatters = extractTag(stdout, 'why_it_matters');
      const scoreText = extractTag(stdout, 'score');
      const justification = extractTag(stdout, 'justification');
      const recommendation = extractTag(stdout, 'recommendation');

      const parsedScore = parseInt(scoreText.match(/\d+/)?.[0] || '1', 10);
      const impact_score = Math.min(Math.max(parsedScore, 1), 10);

      const fullSummary = `${summary}\n\nWhy it matters: ${whyItMatters}`;

      // Run Python zero-shot classification as required by the assignment
      let finalCategory = 'other';
      try {
        const summaryForClassification = summary || diffText;
        const zeroShotCat = await classifyChangeZeroShot(summaryForClassification);
        
        const categoryMapping = {
          'pricing change': 'pricing change',
          'feature update': 'product or feature update',
          'hiring signal': 'hiring signal',
          'content shift': 'content or messaging shift',
          'leadership change': 'leadership or company change',
          'other': 'other'
        };
        finalCategory = categoryMapping[zeroShotCat] || 'other';
      } catch (e) {
        console.warn('Zero-shot classifier failed, falling back to LLM tag category:', e.message);
        const validCategories = [
          'pricing change',
          'product or feature update',
          'hiring signal',
          'content or messaging shift',
          'leadership or company change',
          'other'
        ];
        finalCategory = validCategories.includes(category) ? category : 'other';
      }

      resolve({
        category: finalCategory,
        summary: fullSummary,
        impact_score,
        justification,
        recommendation,
        inferenceTime: parseFloat(duration)
      });
    });

    // Handle timeout (90s limit)
    setTimeout(() => {
      child.kill();
      try {
        fs.unlinkSync(tempPromptFile);
      } catch (e) {}
      reject(new Error('LLM inference timed out (exceeded 90 seconds limit).'));
    }, 90000);
  });
}

module.exports = {
  downloadLlamaCli,
  downloadModel,
  analyzeChange
};
