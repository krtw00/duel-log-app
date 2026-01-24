export default function handler(req) {
  return new Response(JSON.stringify({ status: 'ok', url: req.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
