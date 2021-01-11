import electron from "electron";

const app = electron.app ?? electron.remote.app;
export const isDev = !app.isPackaged;
