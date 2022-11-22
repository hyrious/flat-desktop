import type { VideoEncoderConfiguration } from "agora-electron-sdk";

export const LOW_VOLUME_LEVEL_THRESHOLD = 0.00001;

/** 640 × 480, frame rate 30 fps, bitrate 750 Kbps. */
export const VideoProfileLandscape480p4: VideoEncoderConfiguration = {
    dimensions: { width: 640, height: 480 },
    frameRate: 30,
    bitrate: 750,
};
