import http from 'node:http';import worker from './worker/index.js';
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const r=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}),process.env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end('Server error')}});const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag === -1 ? (process.env.PORT || 3000) : process.argv[portFlag + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Choose a port from 1 to 65535, for example npm run dev -- --port 3002.');
  process.exit(1);
}
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the old server or choose another port with --port.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Cadrotsentry is running at http://localhost:${port}`);
});
