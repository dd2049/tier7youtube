import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedSeedVideos;

export async function getSeedVideos() {
  if (cachedSeedVideos) {
    return cachedSeedVideos;
  }

  const sourcePath = path.join(process.cwd(), "videos.js");
  const source = await readFile(sourcePath, "utf8");
  const match = source.match(/const VIDEOS = (\[.*\]);/s);

  if (!match) {
    throw new Error("Could not parse seed videos from videos.js");
  }

  cachedSeedVideos = JSON.parse(match[1]).map((video) => ({
    ...video,
    locked: false,
    importedAt: null,
    source: "studio"
  }));

  return cachedSeedVideos;
}
