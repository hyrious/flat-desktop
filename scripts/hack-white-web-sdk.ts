import fs from "fs";
import https from "https";
import path from "path";
import zlib from "zlib";

const indexJs = require.resolve("white-web-sdk");

function lookupPackageJson(dir: string): string | undefined {
    const filepath = path.join(dir, "package.json");
    if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
        return filepath;
    } else {
        const parent = path.dirname(dir);
        if (parent !== dir) {
            return lookupPackageJson(parent);
        } else {
            return;
        }
    }
}

const pkgJSON = lookupPackageJson(path.dirname(indexJs));
if (!pkgJSON) {
    console.log("not found white-web-sdk");
}

const pkgPath = path.dirname(pkgJSON!);
const pkg = JSON.parse(fs.readFileSync(pkgJSON!, "utf-8"));

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

async function main() {
    const text = await getText(`https://sdk.netless.link/white-web-sdk/${pkg.version}.js`);
    const esm = text.replace(/^window\.WhiteWebSdk=/, "export const WhiteWebSdk=");
    fs.writeFileSync(path.join(pkgPath, "index.esm.js"), esm);
    pkg.module = "index.esm.js";
    fs.writeFileSync(pkgJSON!, JSON.stringify(pkg, null, 2));
}

main().catch(console.error.bind(console));
