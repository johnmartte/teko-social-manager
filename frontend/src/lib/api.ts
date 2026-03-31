const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type FetchOptions = {
  method?: string;
  body?: unknown;
};

function getTokenHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const headers: Record<string, string> = {};
  const ig = localStorage.getItem("ig_token");
  const igUser = localStorage.getItem("ig_user_id");
  const fb = localStorage.getItem("fb_token");
  const fbPage = localStorage.getItem("fb_page_id");
  if (ig) headers["X-IG-Token"] = ig;
  if (igUser) headers["X-IG-User-Id"] = igUser;
  if (fb) headers["X-FB-Token"] = fb;
  if (fbPage) headers["X-FB-Page-Id"] = fbPage;
  return headers;
}

export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getTokenHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Error desconocido");
  }

  return data as T;
}

export function getLoginUrl(): string {
  return `${API_URL}/auth/login`;
}

export function formatNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
