/**
 * Server for development purposes
 */
const server = Bun.serve({
  async fetch() {
    const filePath = import.meta.dir + '/../dist/v1/script.js';
    const file = Bun.file(filePath)
    const stream = file.stream();
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  },
});
console.log(`Listening on localhost:${server.port}`);
