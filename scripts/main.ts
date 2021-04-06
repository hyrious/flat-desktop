import { ChildProcess, spawn } from "child_process";
import esbuild from "esbuild";
import fs from "fs";
import pkg from "../package.json";

async function main() {
    let child: ChildProcess | undefined;
    const external = Object.keys(pkg.dependencies);
    const build = await esbuild.build({
        entryPoints: ["src/main/index.ts"],
        bundle: true,
        platform: "node",
        target: "node14",
        external: [...external, "electron"],
        sourcemap: true,
        incremental: true,
        outfile: pkg.main,
    });
    child = spawn("npm", ["run", "serve:main"], { stdio: "inherit" });
    fs.watch("src/main", async () => {
        await build.rebuild();
        child?.kill("SIGTERM");
        child = spawn("npm", ["run", "serve:main"], { stdio: "inherit" });
    });
}

main().catch(console.error.bind(console));
