import { createAdminToken, isValidPassword, setAdminCookie } from "@/lib/admin-auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (!isValidPassword(body.password)) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAdminCookie(createAdminToken());
  return Response.json({ ok: true });
}
