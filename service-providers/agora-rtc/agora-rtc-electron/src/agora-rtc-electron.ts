import { IServiceVideoChat } from "@netless/flat-services";

export interface AgoraRTCElectronConfig {
    APP_ID: string;
}

export class AgoraRTCElectron extends IServiceVideoChat {
    public readonly APP_ID: string;

    public constructor({ APP_ID }: AgoraRTCElectronConfig) {
        super();
        this.APP_ID = APP_ID;
    }

    // public isJoinedRoom: boolean;
    // public shareScreen: IServiceShareScreen;
    // public joinRoom(config: IServiceVideoChatJoinRoomConfig): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public leaveRoom(): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public setRole(role: IServiceVideoChatRole): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public getAvatar(uid?: string | undefined): IServiceVideoChatAvatar | undefined {
    //     throw new Error("Method not implemented.");
    // }
    // public getTestAvatar(): IServiceVideoChatAvatar {
    //     throw new Error("Method not implemented.");
    // }
    // public getVolumeLevel(uid?: string | undefined): number {
    //     throw new Error("Method not implemented.");
    // }
    // public setCameraID(deviceId: string): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public getCameraID(): string | undefined {
    //     throw new Error("Method not implemented.");
    // }
    // public setMicID(deviceId: string): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public getMicID(): string | undefined {
    //     throw new Error("Method not implemented.");
    // }
    // public setSpeakerID(deviceId: string): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
    // public getSpeakerID(): string | undefined {
    //     throw new Error("Method not implemented.");
    // }
    // public getCameraDevices(): Promise<IServiceVideoChatDevice[]> {
    //     throw new Error("Method not implemented.");
    // }
    // public getMicDevices(): Promise<IServiceVideoChatDevice[]> {
    //     throw new Error("Method not implemented.");
    // }
    // public getSpeakerDevices(): Promise<IServiceVideoChatDevice[]> {
    //     throw new Error("Method not implemented.");
    // }
    // public getSpeakerVolume(): number {
    //     throw new Error("Method not implemented.");
    // }
}
