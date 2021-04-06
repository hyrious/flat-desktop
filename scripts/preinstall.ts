import fs from "fs";
import path from "path";

const agoraSdkOptions = {
    electronVersion: "11.0.0",
    arch: process.platform === "win32" ? "ia32" : "x64",
    msvs_version: "2017",
    silent: false,
    debug: false,
    prebuilt: true,
};

const npmrcPath = path.join(__dirname, "..", ".npmrc");

writeAgoraToNpmrc().catch(console.error.bind(console));

async function writeAgoraToNpmrc() {
    const agoraOptions = addAgoraNpmrcPrefix(agoraSdkOptions);
    const options = await readNpmrc(npmrcPath);
    Object.keys(agoraOptions).forEach((key) => {
        options[key] = agoraOptions[key];
        process.env[`npm_config_${key}`] = agoraOptions[key];
    });
    await writeNpmrc(npmrcPath, options);
}

function addAgoraNpmrcPrefix(agoraSdkOptions) {
    return Object.keys(agoraSdkOptions).reduce((npmrcOptions, key) => {
        if (key === "electron_version") {
            npmrcOptions[`agora_electron_dependent`] = `${agoraSdkOptions[key]}`;
        }
        npmrcOptions[`agora_electron_${key}`] = `${agoraSdkOptions[key]}`;
        return npmrcOptions;
    }, {});
}

async function readNpmrc(npmrcPath: string) {
    const result = {};
    try {
        const str = await fs.promises.readFile(npmrcPath, "utf-8");
        const optMatcher = /^([^=]+)=([^=]*)$/gm;
        for (let matchResult; (matchResult = optMatcher.exec(str)) !== null; ) {
            result[matchResult[1].trim()] = matchResult[2].trim();
        }
    } catch {}
    return result;
}

async function writeNpmrc(npmrcPath: string, options: Record<string, any>) {
    const str = Object.keys(options)
        .map((key) => `${key}=${options[key]}`)
        .join("\n");
    await fs.promises.writeFile(npmrcPath, str);
}
