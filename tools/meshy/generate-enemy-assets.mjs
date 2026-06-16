import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const apiBaseUrl = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const manifestPath = process.argv[2] ?? 'tools/meshy/manifests/enemies.json';
const args = process.argv.slice(3);
const npmOriginalArgs = JSON.parse(process.env.npm_config_argv ?? '{"original":[]}').original ?? [];
const only = new Set(
  (
    args.find((arg) => arg.startsWith('--only='))?.split('=')[1] ??
    npmOriginalArgs.find((arg) => String(arg).startsWith('--only='))?.split('=')[1] ??
    process.env.npm_config_only ??
    ''
  )
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);
const refine = !args.includes('--preview-only') && process.env.npm_config_preview_only !== 'true';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const apiKey = await readApiKey(manifest.apiKeyFile);

if (!apiKey) {
  throw new Error('Set MESHY_API_KEY or provide manifest.apiKeyFile.');
}

const outputDir = manifest.outputDir ?? 'public/assets/enemies';
const metadataDir = manifest.metadataDir ?? 'tools/meshy/generated/enemies';
const maxAssetBytes = Number(manifest.maxAssetBytes ?? 12_000_000);
const selectedAssets = (manifest.assets ?? []).filter((asset) => only.size === 0 || only.has(asset.id));

if (!selectedAssets.length) {
  throw new Error(`No enemy Meshy asset matched --only=${[...only].join(',')}`);
}

await mkdir(outputDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });

for (const asset of selectedAssets) {
  console.info(`[meshy] creating preview ${asset.id}`);
  const previewTaskId = await createTask({
    mode: 'preview',
    prompt: asset.prompt,
    ai_model: asset.aiModel ?? manifest.defaultModel ?? 'meshy-6',
    should_remesh: asset.shouldRemesh ?? true,
    topology: asset.topology ?? 'triangle',
    target_polycount: asset.targetPolycount,
    decimation_mode: asset.decimationMode,
    target_formats: asset.targetFormats ?? manifest.defaultTargetFormats ?? ['glb'],
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
  if (bytes.byteLength > maxAssetBytes) {
    throw new Error(`${asset.id} GLB is ${bytes.byteLength} bytes, over budget ${maxAssetBytes}`);
  }

  const fileName = asset.fileName ?? `${asset.id}.glb`;
  await writeFile(join(outputDir, fileName), bytes);
  await writeFile(
    join(metadataDir, `${asset.id}.json`),
    `${JSON.stringify(
      {
        assetId: asset.id,
        bytes: bytes.byteLength,
        decimationMode: asset.decimationMode,
        fileName,
        generatedAt: new Date().toISOString(),
        outputTaskId: outputTask.id,
        previewTaskId: previewTask.id,
        refined: refine,
        targetPolycount: asset.targetPolycount,
      },
      null,
      2,
    )}\n`,
  );
  console.info(`[meshy] wrote ${join(outputDir, fileName)} (${bytes.byteLength} bytes)`);
}

async function readApiKey(apiKeyFile) {
  if (process.env.MESHY_API_KEY) {
    return process.env.MESHY_API_KEY.trim();
  }
  try {
    return apiKeyFile ? (await readFile(apiKeyFile, 'utf8')).trim() : '';
  } catch {
    return '';
  }
}

async function createRefinedTask(asset, previewTaskId) {
  console.info(`[meshy] creating refine ${asset.id}`);
  const refineTaskId = await createTask({
    mode: 'refine',
    preview_task_id: previewTaskId,
    ai_model: asset.refineModel ?? manifest.defaultModel ?? 'meshy-6',
    target_formats: asset.targetFormats ?? manifest.defaultTargetFormats ?? ['glb'],
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
  const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  const response = await fetch(apiBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cleanPayload),
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
