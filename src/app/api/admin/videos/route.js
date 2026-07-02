import { requireAdmin } from "@/lib/admin-auth";
import { listAdminVideos, setVideoLock } from "@/lib/video-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await listAdminVideos());
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.id || typeof body.locked !== "boolean") {
    return Response.json({ error: "Expected id and locked" }, { status: 400 });
  }

  const updated = await setVideoLock(body.id, body.locked);
  if (!updated) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  return Response.json({ ok: true, state: updated });
}
