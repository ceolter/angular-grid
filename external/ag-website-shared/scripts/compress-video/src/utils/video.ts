import ffmpeg from 'ffmpeg';
import { join, parse } from 'path';

import { copyFiles, deleteFile, exists, fileSize } from './files';

export type Metadata = Record<string, any>;
export interface OnVideoProcessCompleteParams {
    skipReplace?: boolean;
    source: string;
    destination: string;
    originalFileSize: string;
    fileSize: string;
    metadata: Metadata;
    width: number;
    frameRate: number;
}
export type Video = Awaited<ReturnType<typeof getVideo>>;

export async function getVideo({ source }: { source: string }) {
    const process = new ffmpeg(source);
    const video = await process;

    const metadata: Metadata = {
        width: video.metadata.video.resolution.w,
        height: video.metadata.video.resolution.h,
        filename: video.metadata.filename,
        duration: video.metadata.duration.seconds,
        bitrate: video.metadata.video.bitrate,
        codec: video.metadata.video.codec,
        aspect: video.metadata.video.aspect,
        fps: video.metadata.video.fps,
    };

    return {
        video,
        metadata,
    };
}

export async function reduceVideo({
    video,
    destination,
    width,
    frameRate,
}: {
    video: ReturnType<typeof ffmpeg>;
    /**
     * Destination of the resized video
     *
     * NOTE: Can't be the same as the source video, otherwise it fails silently
     */
    destination: string;
    width?: number;
    frameRate?: number;
}) {
    const processVideo = () =>
        new Promise((resolve, reject) => {
            if (width !== undefined) {
                video.setVideoSize(`${width}x?`, true, true);
            }
            if (frameRate !== undefined) {
                video.setVideoFrameRate(frameRate);
            }

            const videoExt = parse(video.metadata.filename).ext;
            const destExt = parse(destination).ext;

            if (videoExt !== destExt) {
                const videoFormat = destExt.slice(1);
                video.setVideoFormat(videoFormat);
            }

            video.save(destination, function (error: any, file: any) {
                if (error) {
                    return reject(new Error('Error saving video file: ' + file));
                }
                return resolve(video);
            });
        });

    await processVideo();

    const newFileSize = await fileSize(destination);

    return {
        fileSize: newFileSize,
    };
}

export async function reduceVideos({
    videos,
    maxWidth,
    maxFrameRate,
    skipReplace,
    onVideoProcessComplete,
}: {
    videos: Video[];
    maxWidth: number;
    maxFrameRate: number;
    skipReplace?: boolean;
    onVideoProcessComplete: (params: OnVideoProcessCompleteParams) => void;
}) {
    return Promise.all(
        videos.map(async ({ video, metadata }) => {
            const source = video.metadata.filename;
            const originalFileSize = await fileSize(source);

            const { name, dir, ext } = parse(source);
            const convertToMp4 = ext !== '.mp4';
            const destExt = convertToMp4 ? '.mp4' : ext;
            const destination = convertToMp4
                ? join(dir, `${name}${destExt}`)
                : join(dir, `${name}-optimized${destExt}`);

            if (await exists(destination)) {
                await deleteFile(destination);
            }

            const width = metadata.width > maxWidth ? maxWidth : metadata.width;
            const frameRate = metadata.fps > maxFrameRate ? maxFrameRate : metadata.fps;
            const { fileSize: videoFileSize } = await reduceVideo({
                video,
                width,
                frameRate,
                destination,
            });

            if (!skipReplace) {
                if (convertToMp4) {
                    await deleteFile(source);
                } else {
                    await copyFiles(destination, source);
                    await deleteFile(destination);
                }
            }

            onVideoProcessComplete?.({
                skipReplace,
                source,
                destination,
                originalFileSize,
                fileSize: videoFileSize,
                metadata,
                width,
                frameRate,
            });
        })
    );
}
