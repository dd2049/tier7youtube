import { mergeImportedVideos } from "@/lib/video-store";
import { fetchYouTubeUploads } from "@/lib/youtube-import";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const imported = await fetchYouTubeUploads();
    return Response.json(await mergeImportedVideos(imported));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
