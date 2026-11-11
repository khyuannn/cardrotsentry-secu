import worker from './worker.mjs';

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
    const url = new URL(req.url, protocol + '://' + req.headers.host);
    if (url.pathname === '/cadrotsentry') {
      const path = url.searchParams.get('__cadrotsentry_path');
      if (path?.startsWith('/')) url.pathname = path;
    }
    url.searchParams.delete('__cadrotsentry_path');
    const options = { method: req.method, headers: req.headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body !== undefined) {
        options.body = typeof req.body === 'string' || Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);
      } else {
        const chunks = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        options.body = Buffer.concat(chunks);
      }
    }
    const response = await worker.fetch(new Request(url, options), process.env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
}
