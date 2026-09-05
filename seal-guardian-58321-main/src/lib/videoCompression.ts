/**
 * Shrink a video in the browser before upload.
 *
 * A phone clip is routinely 30–80MB, well past what the server accepts, so a
 * grievance with a video attached would simply fail to send. This re-encodes
 * the clip through a canvas and MediaRecorder — no external library, since
 * pulling in ffmpeg.wasm would add tens of megabytes to the bundle to solve a
 * problem most uploads do not have.
 *
 * The trade-off is that this plays the clip through in real time to capture it,
 * so a two-minute video takes two minutes to compress. Anything already small
 * enough is passed through untouched rather than made to wait.
 */

export interface VideoCompressionOptions {
    /** Longest edge of the output, in pixels. */
    maxDimension?: number;
    /** Target video bitrate. 1.2 Mbps looks fine for a phone clip of a product. */
    videoBitsPerSecond?: number;
    /** Files at or below this size skip compression entirely. */
    skipBelowBytes?: number;
    /** Refuse anything longer than this, rather than blocking the form for minutes. */
    maxDurationSeconds?: number;
    /** Audio bitrate. Kept because a fault is often audible — a rattle, a whine. */
    audioBitsPerSecond?: number;
}

const DEFAULTS: Required<VideoCompressionOptions> = {
    maxDimension: 1280,
    videoBitsPerSecond: 1_200_000,
    skipBelowBytes: 5 * 1024 * 1024,
    maxDurationSeconds: 180,
    audioBitsPerSecond: 96_000,
};

export const isCompressibleVideo = (file: File): boolean => {
    if (file.type.startsWith('video/')) return true;
    return /\.(mp4|mov|m4v|webm|avi|3gp|mkv)$/i.test(file.name);
};

/** Whether this browser can re-encode at all; Safari historically cannot. */
export const canCompressVideo = (): boolean => {
    if (typeof MediaRecorder === 'undefined') return false;
    return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        .some(t => MediaRecorder.isTypeSupported(t));
};

function pickMimeType(): string {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    return candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

export const compressVideo = async (
    file: File,
    options: VideoCompressionOptions = {}
): Promise<File> => {
    const opts = { ...DEFAULTS, ...options };

    // Small enough already, or a browser that cannot re-encode: send as-is and
    // let the server's size limit be the judge.
    if (file.size <= opts.skipBelowBytes || !canCompressVideo()) return file;

    const mimeType = pickMimeType();
    if (!mimeType) return file;

    const url = URL.createObjectURL(file);

    try {
        const video = document.createElement('video');
        // Not muted: muting drops the audio track we need to re-record. Volume 0
        // keeps the track live while staying silent for whoever is filling the form.
        video.volume = 0;
        video.playsInline = true;
        video.src = url;

        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error('Could not read that video'));
        });

        // A long clip would hold the form hostage for its whole duration, so
        // hand it back untouched and let the size limit report the problem.
        if (video.duration > opts.maxDurationSeconds) return file;

        const scale = Math.min(1, opts.maxDimension / Math.max(video.videoWidth, video.videoHeight));
        const width = Math.round(video.videoWidth * scale);
        const height = Math.round(video.videoHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        const stream = canvas.captureStream(24);

        /*
         * Carry the original audio across.
         *
         * A canvas stream is picture only, so re-encoding used to return a silent
         * clip — and for a grievance the sound is often the evidence: a rattle, a
         * whine, a click. captureStream() on the video element gives us the audio
         * track; if the browser will not provide one we still get the video.
         */
        try {
            const withAudio = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
            withAudio?.getAudioTracks?.().forEach((track: MediaStreamTrack) => stream.addTrack(track));
        } catch (audioError) {
            console.warn('Could not carry the audio track across; sending video only', audioError);
        }

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: opts.videoBitsPerSecond,
            ...(stream.getAudioTracks().length ? { audioBitsPerSecond: opts.audioBitsPerSecond } : {}),
        });

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        const finished = new Promise<Blob>(resolve => {
            recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
        });

        recorder.start();
        await video.play();

        // Draw every frame until the clip ends. requestAnimationFrame keeps this
        // in step with the browser's paint loop rather than a fixed timer.
        await new Promise<void>(resolve => {
            const draw = () => {
                if (video.ended || video.paused) { resolve(); return; }
                ctx.drawImage(video, 0, 0, width, height);
                requestAnimationFrame(draw);
            };
            video.onended = () => resolve();
            draw();
        });

        recorder.stop();
        const blob = await finished;

        // Re-encoding does not always win — a already-efficient clip can come out
        // larger. Keep whichever is smaller.
        if (blob.size >= file.size) return file;

        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const base = file.name.replace(/\.[^.]+$/, '');
        return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
    } catch (error) {
        console.error('Video compression failed, sending original:', error);
        return file;
    } finally {
        URL.revokeObjectURL(url);
    }
};
