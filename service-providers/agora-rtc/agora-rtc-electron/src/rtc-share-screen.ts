import type {
    IRtcEngine,
    Rectangle,
    ScreenCaptureParameters,
    ScreenCaptureSourceInfo,
    ThumbImageBuffer,
} from "agora-electron-sdk";

import {
    IServiceShareScreen,
    IServiceShareScreenInfo,
    IServiceShareScreenParams,
} from "@netless/flat-services";
import { SideEffectManager } from "side-effect-manager";
import { Val, combine } from "value-enhancer";
import { VideoProfileLandscape480p4 } from "./constants";

const { createAgoraRtcEngine, RenderModeType, ScreenCaptureSourceType, ChannelProfileType } =
    require("agora-electron-sdk") as typeof import("agora-electron-sdk");

export interface AgoraRTCElectronShareScreenAvatarConfig {
    APP_ID: string;
    element?: HTMLElement | null;
}

const rect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };

const screenCaptureParams: ScreenCaptureParameters = {
    dimensions: { width: 0, height: 0 },
    bitrate: 0,
    frameRate: 15,
    captureMouseCursor: true,
    windowFocus: false,
    excludeWindowList: [],
    excludeWindowCount: 0,
};

/** This is a fake class that for debug purpose only. */
export class FakeAgoraRTCElectronShareScreen extends IServiceShareScreen {
    public constructor(config: AgoraRTCElectronShareScreenAvatarConfig) {
        super();
        console.log("[FakeAgoraRTCElectronShareScreen] constructor", config);
    }
    public setActive(active: boolean): void {
        console.log("[FakeAgoraRTCElectronShareScreen] setActive", active);
    }
    public setParams(params: IServiceShareScreenParams | null): void {
        console.log("[FakeAgoraRTCElectronShareScreen] setParams", params);
    }
    public enable(enabled: boolean): void {
        console.log("[FakeAgoraRTCElectronShareScreen] enable", enabled);
    }
    public setElement(element: HTMLElement | null): void {
        console.log("[FakeAgoraRTCElectronShareScreen] setElement", element);
    }
    public shouldSubscribeRemoteTrack(): boolean {
        return false;
    }
}

export class AgoraRTCElectronShareScreen extends IServiceShareScreen {
    private readonly APP_ID: string;

    private readonly engine: IRtcEngine;
    private readonly sideEffect = new SideEffectManager();

    private readonly _params$ = new Val<IServiceShareScreenParams | null>(null);
    private readonly _enabled$ = new Val(false);

    private readonly _active$ = new Val(false);
    private readonly _el$: Val<HTMLElement | null | undefined>;

    private readonly _screenInfo$ = new Val<IServiceShareScreenInfo | null>(null);

    public constructor({ APP_ID, element }: AgoraRTCElectronShareScreenAvatarConfig) {
        super();
        this.APP_ID = APP_ID;
        this.engine = createAgoraRtcEngine();
        this._el$ = new Val(element);

        this.sideEffect.push(
            combine([this._active$, this._params$, this._el$]).subscribe(([active, params, el]) => {
                if (el && params) {
                    const uid = Number(params.uid);
                    try {
                        if (active) {
                            // this is an inconsist behavior in agora SDK,
                            // when the `desktop` screen sharing is done,
                            // and then the `web` side does the screen sharing,
                            // the `desktop` will have a black screen.
                            // this is because the SDK has `mute` the remote screen sharing stream
                            this.engine.muteRemoteVideoStream(uid, false);
                            this.engine.setupRemoteVideo({
                                uid,
                                view: el,
                                renderMode: RenderModeType.RenderModeFit,
                            });
                        } else {
                            this.engine.destroyRendererByView(el);
                        }
                        this.events.emit("remote-changed", active);
                    } catch (e) {
                        console.error(e);
                    }
                }
                this.events.emit("remote-changed", active);
            }),
        );

        this.sideEffect.addDisposer(
            combine([this._screenInfo$, this._enabled$]).subscribe(
                async ([screenInfo, enabled]) => {
                    try {
                        if (screenInfo && enabled) {
                            await this.enableShareScreen(screenInfo);
                        } else {
                            await this.disableShareScreen();
                        }
                        this.events.emit("local-changed", enabled);
                    } catch (e) {
                        this.events.emit("err-enable", e);
                    }
                },
            ),
        );
    }

    public shouldSubscribeRemoteTrack(): boolean {
        return !this._enabled$.value;
    }

    public setActive(active: boolean): void {
        this._active$.setValue(active);
    }

    public setParams(params: IServiceShareScreenParams | null): void {
        this._params$.setValue(params);
    }

    public override async getScreenInfo(): Promise<IServiceShareScreenInfo[]> {
        return compact(
            this.engine
                // param 2: icon size, set (0,0) is equal to (32,32)
                .getScreenCaptureSources({ width: 200, height: 125 }, { width: 1, height: 1 }, true)
                .map(convertScreenCaptureSourceToShareScreenInfo),
        );
    }

    public override setScreenInfo(info: IServiceShareScreenInfo | null): void {
        this._screenInfo$.setValue(info);
    }

    public enable(enabled: boolean): void {
        if (this._el$.value && this._active$.value) {
            throw new Error("There already exists remote screen track.");
        }
        this._enabled$.setValue(enabled);
    }

    public setElement(element: HTMLElement | null): void {
        this._el$.setValue(element);
    }

    public override async destroy(): Promise<void> {
        super.destroy();
        this.sideEffect.flushAll();
    }

    private _pTogglingShareScreen?: Promise<unknown>;
    private _lastEnabled = false;

    public async enableShareScreen(screenInfo: IServiceShareScreenInfo): Promise<void> {
        if (!this._params$.value) {
            throw new Error("Should call joinRoom() before share screen.");
        }

        if (this._lastEnabled === true) {
            return;
        }
        this._lastEnabled = true;

        if (this._pTogglingShareScreen) {
            await this._pTogglingShareScreen;
        }

        const { roomUUID, token, uid } = this._params$.value;

        this._pTogglingShareScreen = new Promise<void>(resolve => {
            const handler = (): void => {
                this.engine.setVideoEncoderConfiguration(VideoProfileLandscape480p4);
                const { width, height } = screenInfo;
                if (screenInfo.type === "display") {
                    this.engine.startScreenCaptureByDisplayId(
                        screenInfo.screenId as number,
                        { ...rect, width, height },
                        { ...screenCaptureParams, dimensions: { width, height } },
                    );
                } else {
                    this.engine.startScreenCaptureByWindowId(
                        screenInfo.screenId as any,
                        { ...rect, width, height },
                        { ...screenCaptureParams, dimensions: { width, height } },
                    );
                }
                this.engine.removeListener("onJoinChannelSuccess", handler);
                resolve();
            };
            this.engine.addListener("onJoinChannelSuccess", handler);
            this.engine.initialize({
                appId: this.APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            });
            this.engine.joinChannel(token, roomUUID, Number(uid), {});
        });
        await this._pTogglingShareScreen;
        this._pTogglingShareScreen = undefined;
    }

    public async disableShareScreen(): Promise<void> {
        if (this._pTogglingShareScreen) {
            await this._pTogglingShareScreen;
        }

        if (this._lastEnabled === false) {
            return;
        }
        this._lastEnabled = false;

        this._pTogglingShareScreen = new Promise<void>(resolve => {
            const handler = (): void => {
                this.engine.removeListener("onLeaveChannel", handler);
                this.engine.release();
                resolve();
            };
            this.engine.addListener("onLeaveChannel", handler);
            this.engine.leaveChannel();
        });
        await this._pTogglingShareScreen;
        this._pTogglingShareScreen = undefined;
    }
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

    const image = source.thumbImage ? createImageRenderer(source.thumbImage) : undefined;

    if (type === undefined || screenId === undefined || name === undefined || image === undefined) {
        return null;
    }

    return { type, screenId, name, image, width: image.width, height: image.height };
}

function createImageRenderer(
    thumbImage: ThumbImageBuffer,
): (IServiceShareScreenInfo["image"] & { width: number; height: number }) | undefined {
    const { buffer, width, height } = thumbImage;
    if (buffer === undefined || width === undefined || height === undefined) {
        return undefined;
    }

    return Object.assign(
        (el: HTMLElement) => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
                ctx.putImageData(imageData, 0, 0);
            }
            el.appendChild(canvas);
        },
        { width, height },
    );
}
