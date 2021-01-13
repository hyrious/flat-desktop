import fs from "fs";
import pick from "lodash/pick";
import minimist from "minimist";

const arch = process.platform === "win32" ? "ia32" : "x64";

const platform = process.platform === "win32" ? "win32" : "darwin";

// see: https://github.com/AgoraIO/Electron-SDK/wiki/Installation-Configuration-in-package.json
const defaultOptions = {
    arch,
    platform,
    // agora-electron-sdk currently only supports electron@7.1.2 pre-compilation,
    // but supports electron@7.1.14 in practice.
    electron_version: "7.1.2",
    msvs_version: "2017",
    silent: false,
    debug: false,
    prebuilt: true,
};

const userOptions = pick(minimist(process.argv.slice(2)), ...Object.keys(defaultOptions));

const options = Object.assign(defaultOptions, userOptions);

const lines: string[] = [];
for (let key in options) {
    const value = options[key];
    if (key === "electron_version") key = "dependent";
    const k = "agora_electron_" + key;
    lines.push(k + "=" + value + "\n");
}

fs.writeFileSync(".npmrc", lines.join(""));
