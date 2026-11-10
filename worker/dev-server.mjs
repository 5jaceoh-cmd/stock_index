// 로컬 테스트용: Cloudflare Worker 코드를 Node에서 그대로 실행한다.
// 실행: node worker/dev-server.mjs  →  http://localhost:8787/?symbols=^KS11
import http from "node:http";
import worker from "./worker.js";

const PORT = 8787;
http
  .createServer(async (req, res) => {
    const request = new Request(`http://localhost:${PORT}${req.url}`, { method: req.method });
    const response = await worker.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  })
  .listen(PORT, () => console.log(`worker dev server: http://localhost:${PORT}`));
