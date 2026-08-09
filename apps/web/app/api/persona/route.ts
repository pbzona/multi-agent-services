import {
  createDemoSessionToken,
  serializeDemoSessionCookie,
  type DemoRole,
} from "@repo/demo-auth";

function isDemoRole(value: unknown): value is DemoRole {
  return value === "customer" || value === "admin";
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const role =
    body && typeof body === "object" && "role" in body ? body.role : null;

  if (!isDemoRole(role)) {
    return Response.json(
      { error: "Choose either the customer or admin persona." },
      { status: 400 },
    );
  }

  const token = await createDemoSessionToken(role);
  return Response.json(
    { role },
    { headers: { "set-cookie": serializeDemoSessionCookie(token) } },
  );
}
