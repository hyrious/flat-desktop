import "./style.less";

import React, { useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useTranslate } from "@netless/flat-i18n";
import { WhiteboardStore } from "@netless/flat-stores";

import { WindowsSystemBtnContext } from "../../StoreProvider";

export interface ShareScreenBoardProps {
    enabled: boolean;
    whiteboardStore: WhiteboardStore;
}

export const ShareScreenBoard = observer<ShareScreenBoardProps>(function ShareScreenBoard({
    enabled,
    whiteboardStore,
}) {
    const t = useTranslate();
    const ref = useRef<HTMLDivElement | null>(null);
    const windows = useContext(WindowsSystemBtnContext);
    const [containerEl] = useState(() => document.createElement("div"));

    useEffect(() => {
        if (windows) {
            return windows.createShareScreenBoardPortalWindow(
                containerEl,
                t("share-screen.board-window-title"),
            );
        }
        return;
    }, [containerEl, t, windows]);

    useEffect(() => {
        if (enabled && ref.current) {
            whiteboardStore.whiteboard.render(ref.current);
        } else if (!enabled) {
            // See Whiteboard.tsx <div id="whiteboard">
            const el = document.getElementById("whiteboard");
            if (el) {
                whiteboardStore.whiteboard.render(el);
            }
        }
    }, [enabled, whiteboardStore.whiteboard]);

    return ReactDOM.createPortal(
        <div
            ref={ref}
            className={classNames("share-screen-board", {
                "share-screen-board-enabled": enabled,
            })}
            id="share-screen-board"
        />,
        containerEl,
    );
});
