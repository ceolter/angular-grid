import { getGifStillImageFiles } from '@components/docs/utils/pageData';
import { getDocsGifs } from '@utils/pages';
import type { APIContext } from 'astro';
import gifFrames from 'gif-frames';
import type { Stream } from 'stream';

export function getStaticPaths() {
    const allDocsGifs = getDocsGifs();

    return getGifStillImageFiles({ allDocsGifs });
}

async function streamToBuffer(stream: Stream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const data: Uint8Array[] = [];

        stream.on('data', (chunk: Uint8Array) => {
            data.push(chunk);
        });
        stream.on('end', () => {
            resolve(Buffer.concat(data));
        });
        stream.on('error', (err: Error) => {
            reject(err);
        });
    });
}

/**
 * Get the first frame of a gif and return the image
 */
export async function GET({
    props,
}: APIContext<{
    fullFilePath: string;
}>) {
    const { fullFilePath } = props;
    const [firstFrame] = await gifFrames({
        url: fullFilePath,
        frames: 0,
        type: 'png',
        quality: 100,
    });
    const buffer = await streamToBuffer(firstFrame.getImage());
    return new Response(buffer);
}
