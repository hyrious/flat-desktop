import { AbstractWindow, CustomWindow } from "../abstract";
import { constants } from "flat-types";

export class WindowShareScreenBoard extends AbstractWindow<false> {
    public constructor() {
        super(false, constants.WindowsName.ShareScreenBoard);
    }

    public create(options: Electron.BrowserWindowConstructorOptions): CustomWindow {
        const win = this.createWindow(
            {
                url: "",
                name: constants.WindowsName.ShareScreenBoard,
                isOpenDevTools: false,
                isPortal: true,
                interceptClose: true,
            },
            {
                // @ts-ignore
                webContents: options.webContents,
                frame: false,
                // in order to hide macOS window button, here need to override the titleBarStyle.
                // see: https://www.electronjs.org/docs/latest/tutorial/window-customization#show-and-hide-the-traffic-lights-programmatically-macos
                titleBarStyle: "default",
                // I guess we do not need to set position and size?
                transparent: true,
                fullscreen: true,
            },
        );

        // default level is: floating, at this level, other applications can still override this window
        // so, we used modal-panel level
        // win.window.setAlwaysOnTop(true, "modal-panel");

        // prevent the window from being captured by screen capture
        win.window.setContentProtection(true);

        // By default pass through mouse events, later call "toggle-mouse-events" to enable mouse events
        win.window.setIgnoreMouseEvents(true);

        return win;
    }
}
