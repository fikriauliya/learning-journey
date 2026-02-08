const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    if (path === "/") path = "/index.html";
    
    const filePath = `./dist${path}`;
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      const contentType = getContentType(path);
      return new Response(file, {
        headers: { "Content-Type": contentType }
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

function getContentType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "text/plain";
}

console.log(`🚀 Learning Journey running at http://localhost:${server.port}`);
