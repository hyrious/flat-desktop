import fs from "fs";
import https from "https";
import path from "path";
import zlib from "zlib";

function getText(url: string): Promise<string> {
    const chunks: Uint8Array[] = [];
    const gunzip = zlib.createGunzip();
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.headers["content-encoding"] === "gzip") {
                res.pipe(gunzip);
                gunzip.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                gunzip.on("end", () => {
                    resolve(Buffer.concat(chunks).toString());
                });
            } else {
                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                res.on("end", () => {
                    resolve(Buffer.concat(chunks).toString());
                });
            }
        });
    });
}

async function getJSON(url: string): Promise<object> {
    const text = await getText(url);
    return JSON.parse(text);
}

async function main() {
    const json = await getJSON("https://registry.npmjs.org/white-web-sdk");
    const latestVersion = json["dist-tags"]["latest"];
    console.log("latest version", latestVersion);
    const url = `https://sdk.netless.link/white-web-sdk/${latestVersion}.js`;
    const code = await getText(url);
    const esm = code.replace(/^window\.WhiteWebSdk=/, "export const WhiteWebSdk=");
    await fs.promises.writeFile(path.join(__dirname, "index.esm.js"), esm);
    console.log(">", "index.esm.js");
}

main().catch(console.error.bind(console));
