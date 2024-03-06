export enum WindowsName {
    Main = "Main",
    ShareScreenTip = "ShareScreenTip",
    ShareScreenBoard = "ShareScreenBoard",
    PreviewFile = "PreviewFile",
}

export const PageSize = {
    Splash: {
        width: 960,
        height: 640,
    },
    Login: {
        width: 960,
        height: 640,
    },
    Main: {
        width: 960,
        height: 640,
    },
    Class: {
        width: 1280,
        height: 720,
    },
    Replay: {
        width: 1280,
        height: 720,
    },
    ShareScreenTip: {
        width: 320,
        height: 48,
    },
    PreviewFile: {
        // approximately equal to 16/9
        width: 889,
        height: 500,
    },
} as const;

export type WindowStatus = "minimize" | "maximize" | "close";

export const Portal = "portal;";
