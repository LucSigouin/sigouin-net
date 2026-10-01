// Return a real 404 for assets removed in round 16 instead of the SPA fallback.
const removedAssets = new Set([
  '/assets/proc/kingdom-idle-current-state-2026-09-17.webp',
  '/assets/still/05-ff-crest-cooking-the-lads.webp',
  '/assets/still/06-ff-ref-james-cook.webp',
  '/assets/still/07-ff-ref-ladd-mcconkey.webp',
]);

export function onRequest(context) {
  if (!removedAssets.has(new URL(context.request.url).pathname)) {
    return context.next();
  }
  return new Response(context.request.method === 'HEAD' ? null : 'Not found\n', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}
