import { WindowManager } from "./window-manager";
import { WindowMain } from "./window-main";
import { constants } from "flat-types";
import { WindowShareScreenTip } from "./window-portal/window-share-screen-tip";
import { WindowShareScreenBoard } from "./window-portal/window-share-screen-board";
import { WindowPreviewFile } from "./window-portal/window-preview-file";

export const windowManager = new WindowManager({
    [constants.WindowsName.Main]: new WindowMain(),
    [constants.WindowsName.ShareScreenTip]: new WindowShareScreenTip(),
    [constants.WindowsName.ShareScreenBoard]: new WindowShareScreenBoard(),
    [constants.WindowsName.PreviewFile]: new WindowPreviewFile(),
});
