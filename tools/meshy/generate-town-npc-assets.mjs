import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiBaseUrl = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(scriptDir, 'manifests', 'first-town-npcs.json');
const args = new Set(process.argv.slice(2));
const only = new Set(
  (process.argv.find((arg) => arg.startsWith('--only='))?.split('=')[1] ?? process.env.npm_config_only ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);
const refine = !args.has('--preview-only') && process.env.npm_config_preview_only !== 'true';

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const selectedAssets = manifest.assets.filter((asset) => only.size === 0 || only.has(asset.id));
if (!selectedAssets.length) {
  throw new Error(`No first-town NPC Meshy asset matched --only=${[...only].join(',')}`);
}

const apiKey = await readApiKey(manifest.apiKeyFile);
if (!apiKey) {
  throw new Error(`Set MESHY_API_KEY or add a key file at ${manifest.apiKeyFile}`);
}

await mkdir(manifest.outputDir, { recursive: true });
await mkdir(manifest.metadataDir, { recursive: true });

for (const asset of selectedAssets) {
  console.info(`[meshy] creating NPC preview ${asset.id}`);
  const previewTaskId = await createTask({
    mode: 'preview',
    prompt: asset.prompt,
    ai_model: manifest.defaultModel ?? 'meshy-6',
    should_remesh: true,
    topology: 'triangle',
    target_polycount: asset.targetPolycount,
    target_formats: manifest.defaultTargetFormats ?? ['glb'],
    moderation: true,
    auto_size: true,
    origin_at: 'bottom',
  });
  const previewTask = await waitForTask(previewTaskId, `preview ${asset.id}`);
  const outputTask = refine ? await createRefinedTask(asset, previewTask.id) : previewTask;

  if (!outputTask.model_urls?.glb) {
    throw new Error(`Meshy task ${outputTask.id} did not return a GLB URL`);
  }

  const bytes = await download(outputTask.model_urls.glb);
  if (bytes.byteLength > manifest.maxAssetBytes) {
    throw new Error(`${asset.id} GLB is ${bytes.byteLength} bytes, over budget ${manifest.maxAssetBytes}`);
  }

  const filePath = join(manifest.outputDir, asset.fileName);
  await writeFile(filePath, bytes);
  await writeFile(
    join(manifest.metadataDir, `${asset.id}.json`),
    `${JSON.stringify(
      {
        assetId: asset.id,
        fileName: asset.fileName,
        previewTaskId: previewTask.id,
        outputTaskId: outputTask.id,
        refined: refine,
        targetPolycount: asset.targetPolycount,
        bytes: bytes.byteLength,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  console.info(`[meshy] wrote ${filePath} (${bytes.byteLength} bytes)`);
}

async function readApiKey(apiKeyFile) {
  if (process.env.MESHY_API_KEY) {
    return process.env.MESHY_API_KEY.trim();
  }

  try {
    return (await readFile(apiKeyFile, 'utf8')).trim();
  } catch {
    return '';
  }
}

async function createRefinedTask(asset, previewTaskId) {
  console.info(`[meshy] creating NPC refine ${asset.id}`);
  const refineTaskId = await createTask({
    mode: 'refine',
    preview_task_id: previewTaskId,
    ai_model: manifest.defaultModel ?? 'meshy-6',
    target_formats: manifest.defaultTargetFormats ?? ['glb'],
    texture_prompt: asset.texturePrompt,
    enable_pbr: false,
    hd_texture: false,
    remove_lighting: true,
    moderation: true,
    auto_size: true,
    origin_at: 'bottom',
  });
  return waitForTask(refineTaskId, `refine ${asset.id}`);
}

async function createTask(payload) {
  const response = await fetch(apiBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok || !body.result) {
    throw new Error(`Meshy create failed ${response.status}: ${body.message ?? JSON.stringify(body)}`);
  }
  return body.result;
}

async function waitForTask(taskId, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15 * 60 * 1000) {
    const task = await getTask(taskId);
    console.info(`[meshy] ${label} ${task.status} ${task.progress ?? 0}%`);
    if (task.status === 'SUCCEEDED') return task;
    if (task.status === 'FAILED' || task.status === 'EXPIRED' || task.status === 'CANCELED') {
      throw new Error(`Meshy ${label} failed: ${task.task_error?.message ?? task.status}`);
    }
    await delay(5000);
  }
  throw new Error(`Timed out waiting for Meshy ${label}`);
}

async function getTask(taskId) {
  const response = await fetch(`${apiBaseUrl}/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Meshy retrieve failed ${response.status}: ${body.message ?? JSON.stringify(body)}`);
  }
  return body;
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
