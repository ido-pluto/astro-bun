import type { AstroAdapter, AstroIntegration } from "astro";
import type { Options } from "./types";

export function getAdapter(args?: Options): AstroAdapter {
  return {
    name: "astro-bun-adapter",
    serverEntrypoint: "astro-bun-adapter/server.js",
    args: args ?? {},
    exports: ["stop", "handle", "start", "running"],
    supportedAstroFeatures: {
      hybridOutput: "stable",
      staticOutput: "stable",
      serverOutput: "stable",
      assets: {
        supportKind: "stable",
        isSharpCompatible: true,
        isSquooshCompatible: true,
      },
    },
  };
}

export default function createIntegration(
  userOptions?: Options,
): AstroIntegration {
  return {
    name: "astro-bun",
    hooks: {
      "astro:config:done": ({ setAdapter, config }) => {
        setAdapter(
          getAdapter({
            ...userOptions,
            client: config.build.client?.toString(),
            server: config.build.server?.toString(),
            host: config.server.host,
            port: config.server.port,
            assets: config.build.assets,
          }),
        );

        if (config.output === "static") {
          console.warn(
            `[astro-bun-adapter] \`output: "server"\` or \`output: "hybrid"\` is required to use this adapter.`,
          );
        }
      },
    },
  };
}
