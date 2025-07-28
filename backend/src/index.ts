import http = require("http");
const server = http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "backend" }));
});
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(port, () => console.log("Server listening on http://localhost:" + port));