import { app, BrowserWindow } from "electron";

let win: BrowserWindow | null = null;

function createWindowIfNotExist() {
    if (win == null) {
        win = new BrowserWindow({
            width: 400,
            height: 300,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        win.loadURL("http://localhost:3000");
    }
}

app.whenReady().then(createWindowIfNotExist);

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindowIfNotExist();
    }
});

app.on("window-all-closed", () => {
    app.quit();
});
