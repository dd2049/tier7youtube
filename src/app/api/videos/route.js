import { listPublicVideos } from "@/lib/video-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listPublicVideos());
}
