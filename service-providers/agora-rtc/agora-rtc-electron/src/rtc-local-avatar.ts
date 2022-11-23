import type { IRtcEngine } from "agora-electron-sdk";

import { IServiceVideoChatAvatar, IServiceVideoChatUID } from "@netless/flat-services";
import { SideEffectManager } from "side-effect-manager";
import { Val } from "value-enhancer";

const { ClientRoleType } = require("agora-electron-sdk") as typeof import("agora-electron-sdk");

export interface RTCLocalAvatarConfig {
    engine: IRtcEngine;
    element?: HTMLElement | null;
    _volumeLevels: Map<IServiceVideoChatUID, number>;
}

export class RTCLocalAvatar implements IServiceVideoChatAvatar {
    private readonly engine: IRtcEngine;
    private readonly sideEffect = new SideEffectManager();

    private readonly _volumeLevels: RTCLocalAvatarConfig["_volumeLevels"];

    private readonly _shouldCamera$ = new Val(false);
    private readonly _shouldMic$ = new Val(false);

    private readonly _el$: Val<RTCLocalAvatarConfig["element"]>;
    private _el: HTMLElement | null = null;

    public enableCamera(enabled: boolean): void {
        this._shouldCamera$.setValue(enabled);
    }

    public enableMic(enabled: boolean): void {
        this._shouldMic$.setValue(enabled);
    }

    public setElement(element: HTMLElement | null): void {
        this._el$.setValue(element);
    }

    public getVolumeLevel(): number {
        return this._volumeLevels.get("0") ?? 0;
    }

    public constructor({ engine, element, _volumeLevels }: RTCLocalAvatarConfig) {
        this.engine = engine;
        this._volumeLevels = _volumeLevels;
        this._el$ = new Val(element);

        this.sideEffect.push(
            this._el$.subscribe(el => {
                try {
                    if (el) {
                        this._el = el;
                        if (this._shouldCamera$.value || this._shouldMic$.value) {
                            this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
                        }
                        this.engine.setupLocalVideo({ uid: 0, view: el });
                        this.engine.enableLocalAudio(this._shouldMic$.value);
                        this.engine.enableLocalVideo(this._shouldCamera$.value);
                    } else {
                        this.engine.destroyRendererByView(this._el);
                        this.engine.enableLocalAudio(false);
                        this.engine.enableLocalVideo(false);
                        this.engine.setClientRole(ClientRoleType.ClientRoleAudience);
                        this._el = null;
                    }
                } catch (e) {
                    console.error(e);
                }
            }),
        );

        this.sideEffect.push(
            this._shouldMic$.reaction(shouldMic => {
                if (this._el$.value) {
                    try {
                        if (shouldMic) {
                            this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
                            this.engine.enableLocalAudio(true);
                        } else {
                            this.engine.enableLocalAudio(false);
                            if (!this._shouldCamera$.value) {
                                this.engine.setClientRole(ClientRoleType.ClientRoleAudience);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }),
        );

        this.sideEffect.push(
            this._shouldCamera$.reaction(shouldCamera => {
                if (this._el$.value) {
                    try {
                        if (shouldCamera) {
                            this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
                            this.engine.enableLocalVideo(true);
                        } else {
                            this.engine.enableLocalVideo(false);
                            if (!this._shouldMic$.value) {
                                this.engine.setClientRole(ClientRoleType.ClientRoleAudience);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }),
        );

        this.sideEffect.push(() => {
            this.engine.enableLocalAudio(false);
            this.engine.enableLocalVideo(false);
            this._el$.setValue(null);
        });
    }

    public destroy(): void {
        this.sideEffect.flushAll();
    }
}
