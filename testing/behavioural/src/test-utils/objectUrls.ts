import zlib from 'zlib';

let allBlobs: BlobWithUrl[] = [];
let urlCounter = 0;
let initialized = false;

export interface BlobWithUrl extends Blob {
    _url: string;
    _idx: number;
}

/**
 * This allows to intercept the creation and revocation of object URLs.
 * Also, it polyfills the CompressionStream API and URL class to fix jsdom not properly supporting it
 * It also patches the MouseEvent constructor to work around jsdom not supporting instantiating it manually with vitest
 */
export const objectUrls = {
    init() {
        if (!initialized) {
            initialized = true;
            initialize();
        }
        this.reset();
    },

    reset() {
        urlCounter = 0;
        allBlobs = [];
    },

    all(): BlobWithUrl[] {
        return allBlobs.slice();
    },

    pullBlobs(): Promise<BlobWithUrl[]> {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (allBlobs.length) {
                    clearInterval(interval);
                    resolve(allBlobs.slice());
                    allBlobs = [];
                }
            }, 1);
        });
    },

    async pullBlob(): Promise<BlobWithUrl> {
        const blobs = await this.pullBlobs();
        return blobs[blobs.length - 1];
    },
};

function initialize(): void {
    global.CompressionStream = CompressionStreamPolyfill;

    const oldCreateObjectURL = window.URL.createObjectURL;
    const oldRevokeObjectURL = window.URL.revokeObjectURL;

    window.URL.createObjectURL = function createObjectURL(blob: Blob) {
        const objectUrl = oldCreateObjectURL?.call(window.URL, blob) ?? `#$blob-${urlCounter++}`;
        allBlobs.push(Object.assign(blob, { _url: objectUrl, _idx: allBlobs.length }));
        return objectUrl;
    };

    window.URL.revokeObjectURL = function revokeObjectURL(url: string) {
        oldRevokeObjectURL?.call(window.URL, url);
    };

    Blob.prototype.arrayBuffer ||= function arrayBuffer(this: Blob) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(this);
        });
    };

    Blob.prototype.text ||= function text(this: Blob) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(this);
        });
    };

    Blob.prototype.stream ||= function stream(this: Blob): ReadableStream<Uint8Array> {
        const blob = this;
        return new ReadableStream({
            start(controller) {
                const reader = new FileReader();
                reader.onload = () => {
                    if (reader.result instanceof ArrayBuffer) {
                        controller.enqueue(new Uint8Array(reader.result));
                    }
                    controller.close();
                };
                reader.readAsArrayBuffer(blob);
            },
        });
    };

    const oldMouseEventClass = MouseEvent;

    // This is a workaround for jsdom not supporting MouseEvent constructor

    class MouseEventPolyfill extends oldMouseEventClass {
        constructor(type: string, eventInitDict?: MouseEventInit) {
            super(type, eventInitDict && { ...eventInitDict, view: undefined });
        }
    }

    window.MouseEvent = MouseEventPolyfill;
}

class CompressionStreamPolyfill implements TransformStream {
    public writable: WritableStream<any>;
    public readable: ReadableStream<any>;

    constructor(format: 'gzip' | 'deflate' | 'deflate-raw') {
        const nodeStream =
            format === 'gzip'
                ? zlib.createGzip()
                : format === 'deflate'
                  ? zlib.createDeflate()
                  : format === 'deflate-raw'
                    ? zlib.createDeflateRaw()
                    : null;
        if (!nodeStream) {
            throw new TypeError('Invalid format.');
        }
        this.readable = new ReadableStream({
            start: (controller) => {
                nodeStream.on('data', (chunk) => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', (err) => controller.error(err));
            },
            cancel: (reason) => {
                nodeStream.destroy(reason);
            },
        });

        this.writable = new WritableStream({
            write: (chunk) => {
                return new Promise((resolve, reject) => {
                    chunk = Buffer.from(chunk);
                    if (
                        nodeStream.write(chunk, (err) => {
                            if (err) {
                                reject(err);
                            }
                        })
                    ) {
                        resolve();
                    } else {
                        nodeStream.once('drain', () => resolve());
                    }
                });
            },
            close: () => {
                return new Promise((resolve, reject) => {
                    nodeStream.end();
                    nodeStream.once('finish', () => resolve());
                    nodeStream.once('error', (err) => reject(err));
                });
            },
            abort: (reason) => {
                nodeStream.destroy(reason);
            },
        });
    }
}
