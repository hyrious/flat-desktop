import { IServiceShareScreen, IServiceShareScreenInfo } from "@netless/flat-services";
import { IRtcEngine, ScreenCaptureSourceInfo, ScreenCaptureSourceType } from "agora-electron-sdk";

export interface AgoraRTCElectronShareScreenAvatarConfig {
    engine: IRtcEngine;
}

export class AgoraRTCElectronShareScreen extends IServiceShareScreen {
    public readonly engine: IRtcEngine;

    public constructor({ engine }: AgoraRTCElectronShareScreenAvatarConfig) {
        super();
        this.engine = engine;
    }

    public override async getScreenInfo(): Promise<IServiceShareScreenInfo[]> {
        return compact(
            this.engine
                .getScreenCaptureSources(
                    { width: 200, height: 125 },
                    { width: 16, height: 16 },
                    true,
                )
                .map(convertScreenCaptureSourceToShareScreenInfo),
        );
    }

    // public setParams(params: IServiceShareScreenParams | null): void {
    //     throw new Error("Method not implemented.");
    // }
    // public enable(enabled: boolean): void {
    //     throw new Error("Method not implemented.");
    // }
    // public setElement(element: HTMLElement | null): void {
    //     throw new Error("Method not implemented.");
    // }
    // public override getScreenInfo(): Promise<IServiceShareScreenInfo[]> {
    //     throw new Error("Method not implemented.");
    // }
    // public override setScreenInfo(_info: IServiceShareScreenInfo | null): void {
    //     throw new Error("Method not implemented.");
    // }
}

function compact<T>(array: Array<T | null>): T[] {
    return array.filter(Boolean) as T[];
}

function convertScreenCaptureSourceToShareScreenInfo(
    source: ScreenCaptureSourceInfo,
): IServiceShareScreenInfo | null {
    const type: IServiceShareScreenInfo["type"] | undefined =
        source.type === ScreenCaptureSourceType.ScreencapturesourcetypeWindow
            ? "window"
            : source.type === ScreenCaptureSourceType.ScreencapturesourcetypeScreen
            ? "display"
            : undefined;

    const screenId: IServiceShareScreenInfo["screenId"] | undefined = source.sourceId;

    const name: IServiceShareScreenInfo["name"] | undefined = source.sourceName;

    const image: IServiceShareScreenInfo["image"] | undefined = source.thumbImage?.buffer;

    if (type === undefined || screenId === undefined || name === undefined || image === undefined) {
        return null;
    }

    return { type, screenId, name, image };
}
