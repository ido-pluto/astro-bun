import { Options } from "./types";

export async function sendStaticFile(pathname: string, localPath: URL, options: Options): Promise<Response> {
    const file = Bun.file(localPath);
    const assetsPrefix = `/${options.assets}/`;

	function isImmutableAsset(pathname: string) {
		return pathname.startsWith(assetsPrefix);
	}

    if(isImmutableAsset(pathname)) {
        return new Response(file, {
            headers: {
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });
    }

    return new Response(file);
}