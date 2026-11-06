// /process/ was removed on 2026-10-06. Pages keeps serving deleted files for about a week,
// so answer its page, script and media with the real 404 page instead.
function isRetired(path) {
  return path === '/process' || path.startsWith('/process/') || path === '/js/process.js' || path.startsWith('/assets/proc/');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!isRetired(url.pathname)) return context.next();
  // Pages serves 404.html at its pretty URL, /404.
  const page = await context.env.ASSETS.fetch(new URL('/404', url));
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', 'no-store, no-transform');
  return new Response(context.request.method === 'HEAD' ? null : page.body, { status: 404, headers });
}
