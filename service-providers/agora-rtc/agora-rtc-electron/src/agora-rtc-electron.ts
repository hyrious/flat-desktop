import type {
    AudioVolumeInfo,
    IRtcEngine,
    QualityType,
    RtcConnection,
    RtcStats,
} from "agora-electron-sdk";

import {
    IServiceVideoChat,
    IServiceVideoChatAvatar,
    IServiceVideoChatDevice,
    IServiceVideoChatJoinRoomConfig,
    IServiceVideoChatMode,
    IServiceVideoChatNetworkQualityType,
    IServiceVideoChatRole,
    IServiceVideoChatUID,
} from "@netless/flat-services";
import { SideEffectManager } from "side-effect-manager";

import { RTCLocalAvatar } from "./rtc-local-avatar";
import { RTCRemoteAvatar } from "./rtc-remote-avatar";
import { AgoraRTCElectronShareScreen } from "./rtc-share-screen";
import { LOW_VOLUME_LEVEL_THRESHOLD } from "./constants";

// Note: we must use the global "require()" function to import agora-electron-sdk
// because it is a native node.js addon module.
const { createAgoraRtcEngine, ClientRoleType, ChannelProfileType } =
    require("agora-electron-sdk") as typeof import("agora-electron-sdk");

export interface AgoraRTCElectronConfig {
    APP_ID: string;
}

export class AgoraRTCElectron extends IServiceVideoChat {
    public readonly APP_ID: string;

    public readonly engine: IRtcEngine = createAgoraRtcEngine();

    public readonly shareScreen = new AgoraRTCElectronShareScreen(this);

    private readonly _roomSideEffect = new SideEffectManager();

    private _cameraID?: string;
    private _micID?: string;
    private _speakerID?: string;

    private uid?: IServiceVideoChatUID;
    private roomUUID?: string;
    private mode?: IServiceVideoChatMode;

    public shareScreenUID?: IServiceVideoChatUID;

    public _volumeLevels = new Map<IServiceVideoChatUID, number>();

    private _remoteAvatars = new Map<IServiceVideoChatUID, RTCRemoteAvatar>();

    public get remoteAvatars(): IServiceVideoChatAvatar[] {
        return [...this._remoteAvatars.values()];
    }

    private _localAvatar?: RTCLocalAvatar;
    public get localAvatar(): IServiceVideoChatAvatar {
        return (this._localAvatar ??= new RTCLocalAvatar(this));
    }

    public get isJoinedRoom(): boolean {
        return Boolean(this.roomUUID);
    }

    public constructor({ APP_ID }: AgoraRTCElectronConfig) {
        super();
        this.APP_ID = APP_ID;
        this._init();
    }

    private _init(): void {
        this.engine.initialize({
            appId: this.APP_ID,
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });

        this.sideEffect.add(() => {
            const audio = this.engine.getAudioDeviceManager();
            this._speakerID = audio.getPlaybackDeviceInfo().deviceId;
            this._micID = audio.getRecordingDeviceInfo().deviceId;
            const video = this.engine.getVideoDeviceManager();
            this._cameraID = video.getDevice();

            const onAudioDeviceStateChanged = (): void => {
                const micID = audio.getRecordingDeviceInfo().deviceId;
                micID && this.setMicID(micID);
                const speakerID = audio.getPlaybackDeviceInfo().deviceId;
                speakerID && this.setSpeakerID(speakerID);
            };
            this.engine.addListener("onAudioDeviceStateChanged", onAudioDeviceStateChanged);

            const onVideoDeviceStateChanged = (): void => {
                this.setCameraID(video.getDevice());
            };
            this.engine.addListener("onVideoDeviceStateChanged", onVideoDeviceStateChanged);

            return () => {
                this.engine.removeListener("onAudioDeviceStateChanged", onAudioDeviceStateChanged);
                this.engine.removeListener("onVideoDeviceStateChanged", onVideoDeviceStateChanged);
            };
        }, "init");

        this.sideEffect.add(() => {
            const onError = (_err: number, msg: string): void => {
                this.events.emit("error", new Error(msg));
            };
            this.engine.addListener("onError", onError);
            return () => this.engine.removeListener("onError", onError);
        }, "error");

        if (process.env.NODE_ENV === "development") {
            this.sideEffect.add(() => {
                const onJoinedChannel = ({
                    localUid: uid,
                    channelId: channel,
                }: RtcConnection): void => {
                    console.log(`[RTC] ${uid} join channel ${channel}`);
                };

                const onUserJoined = ({ localUid: uid }: RtcConnection): void => {
                    console.log("[RTC] userJoined", uid);
                };

                const onLeaveChannel = (): void => {
                    console.log("[RTC] onleaveChannel");
                };

                const onError = (err: number, msg: string): void => {
                    console.error("[RTC] onerror----", err, msg);
                };

                this.engine.addListener("onJoinChannelSuccess", onJoinedChannel);
                this.engine.addListener("onUserJoined", onUserJoined);
                this.engine.addListener("onLeaveChannel", onLeaveChannel);
                this.engine.addListener("onError", onError);

                return () => {
                    this.engine.removeListener("onJoinChannelSuccess", onJoinedChannel);
                    this.engine.removeListener("onUserJoined", onUserJoined);
                    this.engine.removeListener("onLeaveChannel", onLeaveChannel);
                    this.engine.removeListener("onError", onError);
                };
            }, "dev-log");
        }
    }

    public override async destroy(): Promise<void> {
        super.destroy();
        this.sideEffect.flushAll();
        await this.leaveRoom();
        this.engine.release();
    }

    public async joinRoom(config: IServiceVideoChatJoinRoomConfig): Promise<void> {
        if (this.roomUUID) {
            if (this.roomUUID === config.roomUUID) {
                return;
            }
            await this.leaveRoom();
        }
        return this._join(config);
    }

    public async leaveRoom(): Promise<void> {
        if (this.roomUUID) {
            this.engine.leaveChannel();
        }
        this._roomSideEffect.flushAll();
        this.uid = void 0;
        this.roomUUID = void 0;
        this.mode = void 0;
        this.shareScreenUID = void 0;
        // this.shareScreen.setActive(false);
        this.shareScreen.setParams(null);
    }

    public getAvatar(uid?: string): IServiceVideoChatAvatar | undefined {
        if (!this.isJoinedRoom) {
            return;
        }
        if (!uid || uid === "0" || this.uid === uid) {
            return this.localAvatar;
        }
        if (this.shareScreenUID === uid) {
            throw new Error("getAvatar(shareScreenUID) is not supported.");
        }
        let remoteAvatar = this._remoteAvatars.get(uid);
        if (!remoteAvatar) {
            remoteAvatar = new RTCRemoteAvatar(this, uid);
            this._remoteAvatars.set(uid, remoteAvatar);
        }
        return remoteAvatar;
    }

    public getTestAvatar(): IServiceVideoChatAvatar {
        return this.localAvatar;
    }

    public getVolumeLevel(uid?: IServiceVideoChatUID): number {
        return this._volumeLevels.get(uid || "0") || 0;
    }

    public async setRole(role: IServiceVideoChatRole): Promise<void> {
        if (this.mode === IServiceVideoChatMode.Broadcast) {
            this.engine.setClientRole(
                role === IServiceVideoChatRole.Host
                    ? ClientRoleType.ClientRoleBroadcaster
                    : ClientRoleType.ClientRoleAudience,
            );
        }
    }

    public getCameraID(): string | undefined {
        return this._cameraID;
    }

    public async setCameraID(deviceId: string): Promise<void> {
        if (this._cameraID !== deviceId) {
            this.engine.getVideoDeviceManager().setDevice(deviceId);
            this._cameraID = deviceId;
            this.events.emit("camera-changed", deviceId);
        }
    }

    public async getCameraDevices(): Promise<IServiceVideoChatDevice[]> {
        return this.engine
            .getVideoDeviceManager()
            .enumerateVideoDevices()
            .map(e => ({
                deviceId: e.deviceId ?? "unknown",
                label: e.deviceName ?? "unknown",
            }));
    }

    public getMicID(): string | undefined {
        return this._micID;
    }

    public async setMicID(deviceId: string): Promise<void> {
        if (this._micID !== deviceId) {
            this.engine.getAudioDeviceManager().setRecordingDevice(deviceId);
            this._micID = deviceId;
            this.events.emit("mic-changed", deviceId);
        }
    }

    public async getMicDevices(): Promise<IServiceVideoChatDevice[]> {
        return this.engine
            .getAudioDeviceManager()
            .enumerateRecordingDevices()
            .map(e => ({
                deviceId: e.deviceId ?? "unknown",
                label: e.deviceName ?? "unknown",
            }));
    }

    public getSpeakerID(): string | undefined {
        return this._speakerID;
    }

    public async setSpeakerID(deviceId: string): Promise<void> {
        if (this._speakerID !== deviceId) {
            this.engine.getAudioDeviceManager().setPlaybackDevice(deviceId);
            this._speakerID = deviceId;
            this.events.emit("speaker-changed", deviceId);
        }
    }

    public async getSpeakerDevices(): Promise<IServiceVideoChatDevice[]> {
        return this.engine
            .getAudioDeviceManager()
            .enumeratePlaybackDevices()
            .map(e => ({
                deviceId: e.deviceId ?? "unknown",
                label: e.deviceName ?? "unknown",
            }));
    }

    public getSpeakerVolume(): number {
        return this.engine.getAudioDeviceManager().getPlaybackDeviceVolume() / 255 || 0;
    }

    public override async setSpeakerVolume(_volume: number): Promise<void> {
        const volume = _volume < 0 ? 0 : _volume > 1 ? 1 : _volume;
        this.engine.getAudioDeviceManager().setPlaybackDeviceVolume(Math.ceil(volume * 255));
    }

    public override startNetworkTest(): void {
        this.sideEffect.add(() => {
            const onLastmileQuality = (quality: QualityType): void => {
                this.events.emit("network-test", quality);
            };
            this.engine.addListener("onLastmileQuality", onLastmileQuality);
            return () => this.engine.removeListener("onLastmileQuality", onLastmileQuality);
        }, "network-test");

        this.engine.startLastmileProbeTest({
            expectedDownlinkBitrate: 100000,
            expectedUplinkBitrate: 100000,
            probeDownlink: true,
            probeUplink: true,
        });
    }

    public override stopNetworkTest(): void {
        this.engine.stopLastmileProbeTest();
        this.sideEffect.flush("network-test");
    }

    public override startCameraTest(el: HTMLElement): void {
        this.engine.enableVideo();

        const avatar = this.getTestAvatar();
        avatar.setElement(el);
        avatar.enableCamera(true);
        avatar.enableMic(true);

        this.engine.startPreview();
    }

    public override stopCameraTest(): void {
        const avatar = this.getTestAvatar();
        avatar.setElement(null);
        avatar.enableCamera(false);
        avatar.enableMic(false);

        this.engine.stopPreview();
        this.engine.disableVideo();
    }

    public override startMicTest(): void {
        this.engine.getAudioDeviceManager().startRecordingDeviceTest(300);

        this.sideEffect.add(() => {
            this.engine.enableAudioVolumeIndication(500, 3, false);
            const onAudioVolumeIndication = (
                _conn: RtcConnection,
                _speakers: AudioVolumeInfo[],
                _speakerNumber: number,
                totalVolume: number,
            ): void => {
                this.events.emit("volume-level-changed", totalVolume / 255);
            };
            this.engine.addListener("onAudioVolumeIndication", onAudioVolumeIndication);
            return () => {
                this.engine.removeListener("onAudioVolumeIndication", onAudioVolumeIndication);
                this.engine.enableAudioVolumeIndication(0, 0, false);
            };
        }, "mic-test");
    }

    public override stopMicTest(): void {
        this.engine.getAudioDeviceManager().stopRecordingDeviceTest();
        this.sideEffect.flush("mic-test");
    }

    public override startSpeakerTest(filePath: string): void {
        this.engine.enableAudio();
        this.engine.enableLocalAudio(true);
        this.engine.getAudioDeviceManager().startPlaybackDeviceTest(filePath);
    }

    public override stopSpeakerTest(): void {
        this.engine.getAudioDeviceManager().stopPlaybackDeviceTest();
        this.engine.enableLocalAudio(false);
        this.engine.disableAudio();
    }

    private async _join({
        uid,
        token,
        mode,
        refreshToken,
        role,
        roomUUID,
        shareScreenUID,
        shareScreenToken,
    }: IServiceVideoChatJoinRoomConfig): Promise<void> {
        this._roomSideEffect.flushAll();

        this.shareScreenUID = shareScreenUID;

        const channelProfile =
            mode === IServiceVideoChatMode.Broadcast
                ? ChannelProfileType.ChannelProfileLiveBroadcasting
                : ChannelProfileType.ChannelProfileCommunication;
        this.engine.setChannelProfile(channelProfile);
        this.engine.setVideoEncoderConfiguration({
            bitrate: 0,
            degradationPreference: 1,
            frameRate: 15,
            minBitrate: -1,
            mirrorMode: 0,
            orientationMode: 0,
            dimensions: {
                width: 288,
                height: 216,
            },
        });

        if (mode === IServiceVideoChatMode.Broadcast) {
            this.engine.setClientRole(
                role === IServiceVideoChatRole.Host
                    ? ClientRoleType.ClientRoleBroadcaster
                    : ClientRoleType.ClientRoleAudience,
            );
        }

        this.engine.enableAudio();
        this.engine.enableVideo();
        // prevent camera being turned on temporarily right after joining room
        this.engine.enableLocalAudio(false);
        this.engine.enableLocalVideo(false);

        if (refreshToken) {
            this._roomSideEffect.add(() => {
                const handler = async (): Promise<void> => {
                    const token = await refreshToken(roomUUID);
                    this.engine.renewToken(token);
                };
                this.engine.addListener("onTokenPrivilegeWillExpire", handler);
                return () => this.engine.removeListener("onTokenPrivilegeWillExpire", handler);
            });
        }

        this._roomSideEffect.add(() => {
            let lowVolumeLevelCount = 0;
            const updateVolumeLevels = (
                _conn: RtcConnection,
                speakers: Array<{ uid: number; volume: number }>,
            ): void => {
                speakers.forEach(({ uid, volume }) => {
                    volume = volume / 255;

                    if (uid === 0) {
                        const oldVolume = this._volumeLevels.get("0") || 0;
                        this._volumeLevels.set(String(uid), volume);
                        if (this.uid) {
                            this._volumeLevels.set(this.uid, volume);
                        }

                        if (Math.abs(oldVolume - volume) > 0.00001) {
                            this.events.emit("volume-level-changed", oldVolume);
                        }

                        if (volume <= LOW_VOLUME_LEVEL_THRESHOLD) {
                            if (++lowVolumeLevelCount >= 10) {
                                this.events.emit("err-low-volume");
                            }
                        } else {
                            lowVolumeLevelCount = 0;
                        }
                    } else {
                        this._volumeLevels.set(String(uid), volume);
                    }
                });
            };
            const deleteVolumeLevels = (_conn: RtcConnection, uid: number): void => {
                this._volumeLevels.delete(String(uid));
            };

            this.engine.addListener("onAudioVolumeIndication", updateVolumeLevels);
            this.engine.addListener("onUserOffline", deleteVolumeLevels);
            this.engine.addListener("onUserMuteAudio", deleteVolumeLevels);
            return () => {
                this.engine.removeListener("onAudioVolumeIndication", updateVolumeLevels);
                this.engine.removeListener("onUserOffline", deleteVolumeLevels);
                this.engine.removeListener("onUserMuteAudio", deleteVolumeLevels);
            };
        });

        this._roomSideEffect.add(() => {
            const handler = (_conn: RtcConnection, uid_: number): void => {
                const uid: IServiceVideoChatUID = String(uid_);
                if (this.shareScreenUID === uid && this.shareScreen.shouldSubscribeRemoteTrack()) {
                    this.shareScreen.setActive(true);
                    return;
                }
                let avatar = this._remoteAvatars.get(uid);
                if (!avatar) {
                    avatar = new RTCRemoteAvatar(this, uid);
                    this._remoteAvatars.set(uid, avatar);
                }
                avatar.setActive(true);
            };

            this.engine.addListener("onUserJoined", handler);
            return () => this.engine.removeListener("onUserJoined", handler);
        });

        this._roomSideEffect.add(() => {
            const handler = (_conn: RtcConnection, uid_: number): void => {
                const uid: IServiceVideoChatUID = String(uid_);
                if (this.shareScreenUID === uid) {
                    this.shareScreen.setActive(false);
                    return;
                }
                const avatar = this._remoteAvatars.get(uid);
                if (avatar) {
                    avatar.destroy();
                    this._remoteAvatars.delete(uid);
                }
            };
            this.engine.addListener("onUserOffline", handler);
            return () => this.engine.removeListener("onUserOffline", handler);
        });

        this._roomSideEffect.push(
            this.events.remit("network", () => {
                let uplink: IServiceVideoChatNetworkQualityType = 0;
                let downlink: IServiceVideoChatNetworkQualityType = 0;
                let delay = NaN;

                const checkDelay = (_conn: RtcConnection, stats: RtcStats): void => {
                    delay = stats.lastmileDelay || NaN;
                    this.events.emit("network", { uplink, downlink, delay });
                };

                const onNetworkQuality = (
                    _conn: RtcConnection,
                    uid_: number,
                    uplinkQuality: QualityType,
                    downlinkQuality: QualityType,
                ): void => {
                    const uid: IServiceVideoChatUID = String(uid_);
                    if (uid === "0" || uid === this.uid) {
                        uplink = uplinkQuality;
                        downlink = downlinkQuality;
                        this.events.emit("network", { uplink, downlink, delay });
                    }
                };

                this.engine.addListener("onRtcStats", checkDelay);
                this.engine.addListener("onNetworkQuality", onNetworkQuality);
                return () => {
                    this.engine.removeListener("onRtcStats", checkDelay);
                    this.engine.removeListener("onNetworkQuality", onNetworkQuality);
                };
            }),
        );

        const joinRoomToken = token || (await refreshToken?.(roomUUID));
        if (!joinRoomToken) {
            throw new Error("No join room token provided");
        }

        if (this.engine.joinChannel(joinRoomToken, roomUUID, Number(uid), {}) < 0) {
            throw new Error("[RTC]: join channel failed");
        }

        this.engine.enableAudioVolumeIndication(500, 3, false);
        this._roomSideEffect.push(() => this.engine.enableAudioVolumeIndication(0, 0, false));

        this.uid = uid;
        this.roomUUID = roomUUID;
        this.shareScreenUID = shareScreenUID;
        this.mode = mode;
        this.shareScreen.setParams({
            roomUUID,
            token: shareScreenToken,
            uid: shareScreenUID,
        });
    }
}
