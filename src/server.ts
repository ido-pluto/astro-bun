import type { SSRManifest } from "astro";
import type { Options } from "./types";
import type { Server } from "bun";
import { App } from "astro/app";
import { getResolvedHostForHttpServer, sendStaticFile } from "./http-utils";

let _server: Server | undefined = undefined;

export function start(manifest: SSRManifest, options: Options) {
  const app = new App(manifest);

  const logger = app.getAdapterLogger();
  const handle = handler(manifest, options);

  _server = Bun.serve({
    port: options.port,
    hostname: getResolvedHostForHttpServer(options.host),
    fetch: handle,
    error(error) {
      return new Response(`<pre>${error}\n${error.stack}</pre>`, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    },
  });

  logger.info(`Bun server listening on port ${_server.port}`);
}

export function createExports(manifest: SSRManifest, options: Options) {
  const handle = handler(manifest, options);

  return {
    stop() {
      if (_server) {
        _server.stop();
        _server = undefined;
      }
    },
    running() {
      return _server !== undefined;
    },
    async start() {
      return start(manifest, options);
    },
    handle: handle
  };
}

function handler(manifest: SSRManifest, options: Options) {
  const clientRoot = options.client
    ? Bun.pathToFileURL(options.client)
    : new URL("../client/", import.meta.url);

  const app = new App(manifest);

  return async (req: Request) => {
    if (app.match(req)) {
      return await app.render(req);
    }
  
    const url = new URL(req.url);
  
    if (manifest.assets.has(url.pathname)) {
      const localPath = new URL(app.removeBase(url.pathname), clientRoot);
      return sendStaticFile(url.pathname, localPath, options);
    }
  
    return await app.render(req);
  };
}