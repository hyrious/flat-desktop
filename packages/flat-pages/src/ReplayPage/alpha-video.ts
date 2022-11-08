import { SideEffectManager } from "side-effect-manager";

export class AlphaVideo {
    public readonly sideEffect = new SideEffectManager();
    public readonly width = 144 * 17;
    public readonly height = 108;

    public video: HTMLVideoElement | null = null;

    public raf = 0;
    public canvas = document.createElement("canvas");
    public ctx: CanvasRenderingContext2D | null = null;

    private offscreen = document.createElement("canvas");
    private offscreen_ctx: CanvasRenderingContext2D | null = null;

    public constructor() {
        this.offscreen.width = this.canvas.width = this.width;
        this.offscreen.height = this.canvas.height = this.height;
        this.ctx = this.canvas.getContext("2d");
        this.offscreen_ctx = this.offscreen.getContext("2d");
    }

    public get isPlaying(): boolean {
        const { video } = this;
        return (
            video !== null &&
            video.currentTime > 0 &&
            !video.paused &&
            !video.ended &&
            video.readyState > 2
        );
    }

    public setVideo(video: HTMLVideoElement | null): void {
        this.video = video;
        this.sideEffect.flushAll();
        if (video) {
            this.sideEffect.add(() => {
                this.raf = requestAnimationFrame(this.update);
                return () => cancelAnimationFrame(this.raf);
            });
            if (this.ctx) {
                video.parentElement?.appendChild(this.canvas);
            } else {
                video.style.display = "";
            }
        }
    }

    public update = (): void => {
        this.raf = requestAnimationFrame(this.update);
        if (this.video && this.ctx && this.offscreen_ctx && this.isPlaying) {
            this.refreshFrame(this.ctx, this.offscreen_ctx, this.video);
        }
    };

    public refreshFrame(
        ctx: CanvasRenderingContext2D,
        temp_ctx: CanvasRenderingContext2D,
        video: HTMLVideoElement,
    ): void {
        temp_ctx.drawImage(video, 0, 0, this.width, this.height);
        const imageData = temp_ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r === 0 && g === 0 && b === 0) {
                data[i + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    public destroy(): void {
        this.sideEffect.flushAll();
        this.canvas.width = this.canvas.height = 1;
    }
}
