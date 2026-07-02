import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";
import { getSeedVideos } from "./seed-videos";

const LOCAL_STATE_PATH = path.join(process.cwd(), "data", "video-state.json");
const BLOB_PREFIX = "video-library-state/";

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function normalizeVideo(video, index) {
  return {
    id: video.id,
    title: video.title,
    url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
    order: Number.isFinite(video.order) ? video.order : index + 1,
    locked: Boolean(video.locked),
    importedAt: video.importedAt || null,
    publishedAt: video.publishedAt || null,
    source: video.source || "manual"
  };
}

function normalizeState(state) {
  return {
    updatedAt: state?.updatedAt || new Date().toISOString(),
    videos: (state?.videos || []).map(normalizeVideo)
  };
}

async function createSeedState() {
  return normalizeState({
    updatedAt: new Date().toISOString(),
    videos: await getSeedVideos()
  });
}

async function readFromBlob() {
  const result = await list({ prefix: BLOB_PREFIX, limit: 1000 });
  const latest = result.blobs
    .filter((blob) => blob.pathname.endsWith(".json"))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  if (!latest) {
    return null;
  }

  const response = await fetch(latest.url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not read blob state: ${response.status}`);
  }

  return normalizeState(await response.json());
}

async function saveToBlob(state) {
  await put(`${BLOB_PREFIX}${Date.now()}.json`, JSON.stringify(state, null, 2), {
    access: "public",
    contentType: "application/json"
  });
}

async function readLocal() {
  try {
    return normalizeState(JSON.parse(await readFile(LOCAL_STATE_PATH, "utf8")));
  } catch {
    return null;
  }
}

async function saveLocal(state) {
  await mkdir(path.dirname(LOCAL_STATE_PATH), { recursive: true });
  await writeFile(LOCAL_STATE_PATH, JSON.stringify(state, null, 2));
}

export async function readVideoState() {
  const stored = hasBlobStorage() ? await readFromBlob() : await readLocal();
  if (stored) {
    return stored;
  }

  const seed = await createSeedState();
  await saveVideoState(seed);
  return seed;
}

export async function saveVideoState(state) {
  const normalized = normalizeState({
    ...state,
    updatedAt: new Date().toISOString()
  });

  if (hasBlobStorage()) {
    await saveToBlob(normalized);
  } else {
    await saveLocal(normalized);
  }

  return normalized;
}

export async function listPublicVideos() {
  const state = await readVideoState();
  const videos = state.videos
    .filter((video) => !video.locked)
    .sort((a, b) => a.order - b.order);

  return {
    updatedAt: state.updatedAt,
    totalCount: state.videos.length,
    unlockedCount: videos.length,
    videos
  };
}

export async function listAdminVideos() {
  const state = await readVideoState();
  return {
    updatedAt: state.updatedAt,
    totalCount: state.videos.length,
    lockedCount: state.videos.filter((video) => video.locked).length,
    videos: state.videos.sort((a, b) => a.order - b.order)
  };
}

export async function setVideoLock(videoId, locked) {
  const state = await readVideoState();
  const videos = state.videos.map((video) => {
    if (video.id !== videoId) {
      return video;
    }

    return {
      ...video,
      locked: Boolean(locked)
    };
  });

  if (!videos.some((video) => video.id === videoId)) {
    return null;
  }

  return saveVideoState({ ...state, videos });
}

export async function mergeImportedVideos(importedVideos) {
  const state = await readVideoState();
  const byId = new Map(state.videos.map((video) => [video.id, video]));
  const minOrder = Math.min(...state.videos.map((video) => video.order), 1);
  let nextOrder = minOrder - importedVideos.length;
  let added = 0;

  for (const imported of importedVideos) {
    if (byId.has(imported.id)) {
      continue;
    }

    byId.set(imported.id, normalizeVideo({
      ...imported,
      order: nextOrder,
      locked: true,
      importedAt: new Date().toISOString(),
      source: "youtube-api"
    }));
    nextOrder += 1;
    added += 1;
  }

  const videos = Array.from(byId.values()).sort((a, b) => a.order - b.order);
  const saved = await saveVideoState({ ...state, videos });

  return {
    added,
    totalCount: saved.videos.length,
    videos: saved.videos
  };
}
