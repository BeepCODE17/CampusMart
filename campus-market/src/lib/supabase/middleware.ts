import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

// Fail fast if Supabase is down or paused, instead of hanging until the platform kills the request.
const AUTH_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Auth check timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function unavailableResponse() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CampusMart is temporarily unavailable</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  main { max-width: 420px; padding: 24px; text-align: center; }
  h1 { font-size: 1.4rem; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.5; }
  a { display: inline-block; margin-top: 12px; padding: 10px 18px; border-radius: 8px; background: #1f57d0; color: #fff; text-decoration: none; }
</style>
</head>
<body>
<main>
  <h1>CampusMart is temporarily unavailable</h1>
  <p>We can't reach our database right now. Please try again in a few minutes.</p>
  <a href="">Try again</a>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8", "retry-after": "60", "cache-control": "no-store" },
  });
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let user: User | null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);
    // status 0 means the request never reached Supabase (network failure), not "signed out".
    if (error?.status === 0) throw error;
    user = data.user;
  } catch (err) {
    console.error("Supabase unreachable, serving 503:", err);
    return unavailableResponse();
  }

  const path = request.nextUrl.pathname;
  if (!user && !PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
