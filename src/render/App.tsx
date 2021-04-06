import React, { useState } from "react";
import { WhiteWebSdk } from "white-web-sdk";
import AgoraRtcEngine from "./agora";

export function App() {
    const [sdk] = useState(
        () => new WhiteWebSdk({ appIdentifier: "ss4WoMf_EeqfCXcv33LmiA/izfIC88inXYJKw" })
    );
    return (
        <div>
            {sdk.boundless.deviceType} {AgoraRtcEngine.toString()}
        </div>
    );
}
