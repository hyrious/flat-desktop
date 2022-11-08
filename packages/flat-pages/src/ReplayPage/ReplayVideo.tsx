import { ClassroomReplayStore } from "@netless/flat-stores";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { AlphaVideo } from "./alpha-video";

export interface ReplayVideoProps {
    classroomReplayStore: ClassroomReplayStore;
}

export const ReplayVideo = observer<ReplayVideoProps>(function ReplayVideo({
    classroomReplayStore,
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [alphaVideo] = useState(() => new AlphaVideo());

    useEffect(() => {
        if (ref.current) {
            if (ref.current.firstChild) {
                ref.current.removeChild(ref.current.firstChild);
            }
            if (classroomReplayStore.video) {
                ref.current.appendChild(classroomReplayStore.video);
            }
            alphaVideo.setVideo(classroomReplayStore.video);
        } else {
            alphaVideo.setVideo(null);
        }
    }, [classroomReplayStore.video]);

    useEffect(() => () => alphaVideo.destroy(), []);

    return <div ref={ref} className="replay-video" />;
});
