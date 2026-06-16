import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const apiBaseUrl = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const projectKeyPath = 'C:/Users/joshs/Projects/meshy-api-key.txt';
const outputDir = 'public/assets/town/first-town';
const metadataDir = 'tools/meshy/generated/first-town';
const args = new Set(process.argv.slice(2));
const only = new Set(
  (process.argv.find((arg) => arg.startsWith('--only='))?.split('=')[1] ?? process.env.npm_config_only ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);
const refine = !args.has('--preview-only') && process.env.npm_config_preview_only !== 'true';
const maxAssetBytes = Number(process.env.MESHY_MAX_TOWN_ASSET_BYTES ?? 18_000_000);

const plans = [
  {
    id: 'town-well',
    fileName: 'town-well.glb',
    targetPolycount: 1400,
    prompt:
      'stylized low-poly fantasy town well game prop, circular stone base, small wooden roof, friendly chibi RPG style, isolated, no text, no logo, simple readable silhouette',
    texturePrompt:
      'warm gray stone well with clean wooden roof, bright friendly fantasy RPG colors, no text, no logo, low detail game-ready materials',
  },
  {
    id: 'weapon-shop-sign',
    fileName: 'weapon-shop-sign.glb',
    targetPolycount: 900,
    prompt:
      'stylized low-poly fantasy weapon shop sign game prop, small hanging wooden sign with crossed swords symbol, chibi RPG style, isolated, no readable text, no logo',
    texturePrompt:
      'warm wooden sign, brass trim, crossed sword icon shapes, clean readable game prop, no letters, no logo',
  },
  {
    id: 'potion-shop-sign',
    fileName: 'potion-shop-sign.glb',
    targetPolycount: 900,
    prompt:
      'stylized low-poly fantasy potion shop sign game prop, small hanging wooden sign with potion bottle symbol, chibi RPG style, isolated, no readable text, no logo',
    texturePrompt:
      'warm wooden sign, purple potion bottle icon shapes, clean readable game prop, no letters, no logo',
  },
  {
    id: 'weapon-shop',
    fileName: 'weapon-shop.glb',
    targetPolycount: 3200,
    prompt:
      'stylized low-poly chibi fantasy RPG weapons shop building, detailed warm wood and stone construction, red roof, awning, weapon racks, crossed swords sign shape, readable game-ready silhouette, no readable text, no characters, isolated prop',
    texturePrompt:
      'warm brown wood walls, light gray stone base, red roof tiles, brass crossed-sword sign shapes, dark door, friendly fantasy RPG colors, no letters, no logo',
  },
  {
    id: 'potion-shop',
    fileName: 'potion-shop.glb',
    targetPolycount: 3200,
    prompt:
      'stylized low-poly chibi fantasy RPG potion store building, detailed white plaster and warm wood construction, purple roof, potion shelves, round bottle sign shape, readable game-ready silhouette, no readable text, no characters, isolated prop',
    texturePrompt:
      'white plaster and warm wood, purple roof tiles, colorful potion bottle sign shapes, friendly fantasy RPG colors, no letters, no logo',
  },
  {
    id: 'village-house',
    fileName: 'village-house.glb',
    targetPolycount: 2600,
    prompt:
      'stylized low-poly chibi fantasy RPG village house, compact cottage with timber frame, teal cloth awning, flower box, lantern, simple readable silhouette, no readable text, no characters, isolated prop',
    texturePrompt:
      'warm tan plaster, dark timber beams, teal awning, small bright flowers, amber lantern, friendly fantasy RPG colors, no letters, no logo',
  },
  {
    id: 'villager-npc',
    fileName: 'villager-npc.glb',
    targetPolycount: 1800,
    prompt:
      'stylized low-poly chibi fantasy RPG villager NPC placeholder, neutral standing idle pose, simple tunic, friendly face, readable from behind-the-back camera, no weapons, no readable text, no logo',
    texturePrompt:
      'friendly villager colors, simple cloth tunic, soft face, clean game-ready materials, no letters, no logo',
  },
  {
    id: 'town-wall-segment',
    fileName: 'town-wall-segment.glb',
    targetPolycount: 1200,
    prompt:
      'stylized low-poly fantasy RPG town wall segment, stone base with warm wooden posts, compact repeatable barrier piece, flat ends for tiling, no gate, no readable text, isolated prop',
    texturePrompt:
      'warm gray stone blocks, dark brown wooden posts, mossy edges, clean low-poly game texture, no letters, no logo',
  },
  {
    id: 'town-ground-tile',
    fileName: 'town-ground-tile.glb',
    targetPolycount: 900,
    prompt:
      'stylized low-poly fantasy RPG ground tile, square grassy dirt path tile, flat terrain piece with painted grass edge and central worn path, repeatable game prop, no plants taller than ankle, no text',
    texturePrompt:
      'green grass border, warm tan dirt path, soft painted fantasy RPG ground colors, clean low-poly texture, no letters, no logo',
  },
];

const selectedPlans = plans.filter((plan) => only.size === 0 || only.has(plan.id));
if (!selectedPlans.length) {
  throw new Error(`No first-town Meshy asset matched --only=${[...only].join(',')}`);
}

const apiKey = await readApiKey();
if (!apiKey) {
  throw new Error(`Set MESHY_API_KEY or add a key file at ${projectKeyPath}`);
}

await mkdir(outputDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });

for (const plan of selectedPlans) {
  console.info(`[meshy] creating preview ${plan.id}`);
  const previewTaskId = await createTask({
    mode: 'preview',
    prompt: plan.prompt,
    ai_model: plan.aiModel ?? 'meshy-6',
    model_type: plan.modelType ?? 'standard',
    should_remesh: plan.shouldRemesh ?? true,
    topology: plan.topology ?? 'triangle',
    ...(plan.decimationMode ? { decimation_mode: plan.decimationMode } : { target_polycount: plan.targetPolycount }),
    target_formats: ['glb'],
    moderation: true,
    auto_size: true,
    origin_at: 'bottom',
  });
  const previewTask = await waitForTask(previewTaskId, `preview ${plan.id}`);
  const outputTask = refine ? await createRefinedTask(plan, previewTask.id) : previewTask;

  if (!outputTask.model_urls?.glb) {
    throw new Error(`Meshy task ${outputTask.id} did not return a GLB URL`);
  }

  const bytes = await download(outputTask.model_urls.glb);
  if (bytes.byteLength > maxAssetBytes) {
    throw new Error(`${plan.id} GLB is ${bytes.byteLength} bytes, over budget ${maxAssetBytes}`);
  }

  const filePath = join(outputDir, plan.fileName);
  await writeFile(filePath, bytes);
  await writeFile(
    join(metadataDir, `${plan.id}.json`),
    `${JSON.stringify(
      {
        assetId: plan.id,
        fileName: plan.fileName,
        previewTaskId: previewTask.id,
        outputTaskId: outputTask.id,
        refined: refine,
        targetPolycount: plan.targetPolycount,
        bytes: bytes.byteLength,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  console.info(`[meshy] wrote ${filePath} (${bytes.byteLength} bytes)`);
}

async function readApiKey() {
  if (process.env.MESHY_API_KEY) {
    return process.env.MESHY_API_KEY.trim();
  }

  try {
    return (await readFile(projectKeyPath, 'utf8')).trim();
  } catch {
    return '';
  }
}

async function createRefinedTask(plan, previewTaskId) {
  console.info(`[meshy] creating refine ${plan.id}`);
  const refineTaskId = await createTask({
    mode: 'refine',
    preview_task_id: previewTaskId,
    ai_model: plan.aiModel ?? 'meshy-6',
    target_formats: ['glb'],
    texture_prompt: plan.texturePrompt,
    enable_pbr: plan.enablePbr ?? false,
    hd_texture: plan.hdTexture ?? false,
    remove_lighting: true,
    moderation: true,
    auto_size: true,
    origin_at: 'bottom',
  });
  return waitForTask(refineTaskId, `refine ${plan.id}`);
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
