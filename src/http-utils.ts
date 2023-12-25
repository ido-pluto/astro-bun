import type { Options } from "./types";

export async function sendStaticFile(
  pathname: string,
  localPath: URL,
  options: Options,
): Promise<Response> {
  const file = Bun.file(localPath);
  const assetsPrefix = `/${options.assets}/`;

  function isImmutableAsset(pathname: string) {
    return pathname.startsWith(assetsPrefix);
  }

  if (isImmutableAsset(pathname)) {
    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response(file);
}


export function getResolvedHostForHttpServer(host: string | boolean) {
  if (host === false) {
    // Use a secure default
    return "127.0.0.1";
  } else if (host === true) {
    // If passed --host in the CLI without arguments
    return undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    return host;
  }
}