import type { SSRManifest } from "astro";
import { App } from "astro/app";
import type { Options } from "./types";
import { pathToFileURL, type Server } from "bun";
import { sendStaticFile } from "./static-files.ts";

let _server: Server | undefined = undefined;

export function start(manifest: SSRManifest, options: Options) {
  const clientRoot = options.client ? pathToFileURL(options.client) :
    new URL("../client/", import.meta.url);
  const app = new App(manifest);

  const logger = app.getAdapterLogger();
  _server = Bun.serve({
    port: options.port,
    hostname: getResolvedHostForHttpServer(options.host),
    async fetch(req) {
      if (app.match(req)) {
        return await app.render(req);
      }

      const url = new URL(req.url);

      if (manifest.assets.has(url.pathname)) {
        const localPath = new URL(app.removeBase(url.pathname), clientRoot);
        return sendStaticFile(url.pathname, localPath, options);
      }

      return await app.render(req);
    },
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
  const app = new App(manifest);
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
    async handle(request: Request) {
      return app.render(request);
    },
  };
}

function getResolvedHostForHttpServer(host: string | boolean) {
	if (host === false) {
		// Use a secure default
		return '127.0.0.1';
	} else if (host === true) {
		// If passed --host in the CLI without arguments
		return undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
	} else {
		return host;
	}
}
