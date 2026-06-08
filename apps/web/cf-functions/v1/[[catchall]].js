/** @param {import('@cloudflare/workers-types').EventContext<{ API_ORIGIN?: string }>} context */
async function proxyApiRequest(context) {
  const url = new URL(context.request.url);
  const origin = context.env.API_ORIGIN?.replace(/\/$/, "");
  if (!origin) {
    return new Response(
      JSON.stringify({
        error: "api_not_deployed",
        message:
          "Phase 2 API is not configured. Set API_ORIGIN on Cloudflare Pages.",
      }),
      {
        status: 503,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*",
        },
      },
    );
  }

  const target = `${origin}${url.pathname}${url.search}`;
  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  const res = await fetch(target, init);
  const outHeaders = new Headers(res.headers);
  outHeaders.set("access-control-allow-origin", "*");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
}

export async function onRequest(context) {
  return proxyApiRequest(context);
}
