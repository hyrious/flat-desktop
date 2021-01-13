import React from "react";

import { AgoraRtcEngine } from "./utils/agora";

export function App() {
    const engine = new AgoraRtcEngine();
    console.log(engine);
    return <div>{AgoraRtcEngine.toString()}</div>;
}
