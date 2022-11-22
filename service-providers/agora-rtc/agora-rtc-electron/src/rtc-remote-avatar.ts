import type { IRtcEngine } from "agora-electron-sdk";

import { IServiceVideoChatAvatar, IServiceVideoChatUID } from "@netless/flat-services";
import { SideEffectManager } from "side-effect-manager";
import { Val, combine } from "value-enhancer";

export interface RTCRemoteAvatarConfig {
    engine: IRtcEngine;
    element?: HTMLElement | null;
    _volumeLevels: Map<IServiceVideoChatUID, number>;
}

export class RTCRemoteAvatar implements IServiceVideoChatAvatar {
    private readonly uid: IServiceVideoChatUID;
    private readonly engine: IRtcEngine;
    private readonly sideEffect = new SideEffectManager();

    private readonly _volumeLevels: RTCRemoteAvatarConfig["_volumeLevels"];

    private readonly _active$ = new Val(false);

    private readonly _shouldCamera$ = new Val(false);
    private readonly _shouldMic$ = new Val(false);

    private readonly _el$: Val<HTMLElement | undefined | null>;

    public setActive(active: boolean): void {
        this._active$.setValue(active);
    }

    public enableCamera(enabled: boolean): void {
        this._shouldCamera$.setValue(enabled);
    }

    public enableMic(enabled: boolean): void {
        this._shouldMic$.setValue(enabled);
    }

    public setElement(el: HTMLElement | null): void {
        this._el$.setValue(el);
    }

    public getVolumeLevel(): number {
        return this._volumeLevels.get(this.uid) ?? 0;
    }

    public constructor(config: RTCRemoteAvatarConfig, uid: IServiceVideoChatUID) {
        this.engine = config.engine;
        this.uid = uid;
        this._volumeLevels = config._volumeLevels;
        this._el$ = new Val(config.element);

        this.sideEffect.push(
            combine([this._el$, this._active$]).subscribe(([el, active]) => {
                if (el && active) {
                    try {
                        this.engine.setupRemoteVideo({ uid: Number(this.uid), view: el });
                    } catch (e) {
                        console.error(e);
                    }
                }
            }),
        );

        this.sideEffect.push(
            combine([this._el$, this._active$, this._shouldMic$]).subscribe(
                ([el, active, shouldMic]) => {
                    try {
                        this.engine.muteRemoteAudioStream(
                            Number(this.uid),
                            !(el && active && shouldMic),
                        );
                    } catch (e) {
                        console.error(e);
                    }
                },
            ),
        );

        this.sideEffect.push(
            combine([this._el$, this._active$, this._shouldCamera$]).subscribe(
                ([el, active, shouldCamera]) => {
                    try {
                        this.engine.muteRemoteVideoStream(
                            Number(this.uid),
                            !(el && active && shouldCamera),
                        );
                    } catch (e) {
                        console.error(e);
                    }
                },
            ),
        );

        this.sideEffect.push(() => {
            this._active$.setValue(false);
        });
    }

    public destroy(): void {
        this.sideEffect.flushAll();
    }
}
