// This adapter is server-only. No SDK or credentials enter the public build.
export function createBackend(env, fetcher = fetch) {
  const base = env.SUPABASE_URL?.replace(/\/$/, "");
  const configured = Boolean(base?.startsWith("https://") && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_ANON_KEY);
  async function request(path, { method = "GET", body, token, auth = false, prefer } = {}) {
    if (!configured) throw Object.assign(new Error("Service unavailable"), { status: 503 });
    const key = auth ? env.SUPABASE_ANON_KEY : env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetcher(`${base}${path}`, {
      method, signal: AbortSignal.timeout(10000),
      headers: { apikey: key, Authorization: `Bearer ${token || key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      // Do not propagate provider errors: they can include submitted records.
      const status = auth && [400, 401, 403, 422].includes(response.status) ? 401 : 503;
      throw Object.assign(new Error(status === 401 ? "Authentication failed" : "Service unavailable"), { status });
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  return {
    configured,
    signIn: (email, password) => request("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password }, auth: true }),
    user: token => request("/auth/v1/user", { token, auth: true }),
    signOut: token => request("/auth/v1/logout?scope=local", { method: "POST", token, auth: true }),
    rpc: (name, body) => request(`/rest/v1/rpc/${name}`, { method: "POST", body }),
    select: (table, query) => request(`/rest/v1/${table}?${new URLSearchParams(query)}`),
    insert: (table, body) => request(`/rest/v1/${table}`, { method: "POST", body, prefer: "return=representation" }),
    patch: (table, query, body) => request(`/rest/v1/${table}?${new URLSearchParams(query)}`, { method: "PATCH", body, prefer: "return=representation" }),
    remove: (table, query) => request(`/rest/v1/${table}?${new URLSearchParams(query)}`, { method: "DELETE" }),
  };
}
