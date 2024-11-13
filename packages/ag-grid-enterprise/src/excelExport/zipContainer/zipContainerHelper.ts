import { _errMsg } from 'ag-grid-community';

import { deflateLocalFile } from './compress';
import { convertDate, convertDecToHex, convertTime } from './convert';
import { getCrcFromCrc32Table } from './crcTable';
import type { ZipFile } from './zipContainer';

interface ZipFileHeader {
    localFileHeader: Uint8Array;
    centralDirectoryHeader: Uint8Array;
}

export interface ProcessedZipFile extends ZipFileHeader {
    content: Uint8Array;
    isCompressed: boolean;
}

/**
 * It encodes any string in UTF-8 format
 * taken from https://github.com/mathiasbynens/utf8.js
 * @param {string} s
 * @returns {string}
 */
function _utf8_encode(s: string | null): string {
    const stringFromCharCode = String.fromCharCode;

    function ucs2decode(string: string | null): number[] {
        const output: number[] = [];

        if (!string) {
            return [];
        }

        const len = string.length;

        let counter = 0;
        let value;
        let extra;

        while (counter < len) {
            value = string.charCodeAt(counter++);
            if (value >= 0xd800 && value <= 0xdbff && counter < len) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt(counter++);
                if ((extra & 0xfc00) == 0xdc00) {
                    // low surrogate
                    output.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
                } else {
                    // unmatched surrogate; only append this code unit, in case the next
                    // code unit is the high surrogate of a surrogate pair
                    output.push(value);
                    counter--;
                }
            } else {
                output.push(value);
            }
        }
        return output;
    }

    function checkScalarValue(point: number) {
        if (point >= 0xd800 && point <= 0xdfff) {
            throw Error(_errMsg(255, { point }));
        }
    }

    function createByte(point: number, shift: number) {
        return stringFromCharCode(((point >> shift) & 0x3f) | 0x80);
    }

    function encodeCodePoint(point: number): string {
        if ((point & 0xffffff80) == 0) {
            // 1-byte sequence
            return stringFromCharCode(point);
        }

        let symbol = '';

        if ((point & 0xfffff800) == 0) {
            // 2-byte sequence
            symbol = stringFromCharCode(((point >> 6) & 0x1f) | 0xc0);
        } else if ((point & 0xffff0000) == 0) {
            // 3-byte sequence
            checkScalarValue(point);
            symbol = stringFromCharCode(((point >> 12) & 0x0f) | 0xe0);
            symbol += createByte(point, 6);
        } else if ((point & 0xffe00000) == 0) {
            // 4-byte sequence
            symbol = stringFromCharCode(((point >> 18) & 0x07) | 0xf0);
            symbol += createByte(point, 12);
            symbol += createByte(point, 6);
        }
        symbol += stringFromCharCode((point & 0x3f) | 0x80);
        return symbol;
    }

    const codePoints = ucs2decode(s);
    const length = codePoints.length;
    let index = -1;
    let codePoint;
    let byteString = '';

    while (++index < length) {
        codePoint = codePoints[index];
        byteString += encodeCodePoint(codePoint);
    }

    return byteString;
}

const getHeaders = (
    currentFile: ZipFile,
    isCompressed: boolean,
    offset: number,
    rawSize: number,
    rawContent: string | Uint8Array,
    deflatedSize: number | undefined
): ZipFileHeader => {
    const { content, path, created: creationDate } = currentFile;

    const time = convertTime(creationDate);
    const dt = convertDate(creationDate);

    const crcFlag = getCrcFromCrc32Table(rawContent);
    const zipSize = deflatedSize !== undefined ? deflatedSize : rawSize;

    const utfPath = _utf8_encode(path);
    const isUTF8 = utfPath !== path;

    let extraFields = '';
    if (isUTF8) {
        const uExtraFieldPath = convertDecToHex(1, 1) + convertDecToHex(getCrcFromCrc32Table(utfPath), 4) + utfPath;
        extraFields = '\x75\x70' + convertDecToHex(uExtraFieldPath.length, 2) + uExtraFieldPath;
    }

    const commonHeader =
        '\x14\x00' + // version needed to extract
        (isUTF8 ? '\x00\x08' : '\x00\x00') + // Language encoding flag (EFS) (12th bit turned on)
        convertDecToHex(isCompressed ? 8 : 0, 2) + // As per ECMA-376 Part 2 specs
        convertDecToHex(time, 2) + // last modified time
        convertDecToHex(dt, 2) + // last modified date
        convertDecToHex(zipSize ? crcFlag : 0, 4) +
        convertDecToHex(deflatedSize ?? rawSize, 4) + // compressed size
        convertDecToHex(rawSize, 4) + // uncompressed size
        convertDecToHex(utfPath.length, 2) + // file name length
        convertDecToHex(extraFields.length, 2); // extra field length

    const localFileHeader = 'PK\x03\x04' + commonHeader + utfPath + extraFields;
    const centralDirectoryHeader =
        'PK\x01\x02' + // central header
        '\x14\x00' +
        commonHeader + // file header
        '\x00\x00' +
        '\x00\x00' +
        '\x00\x00' +
        (content ? '\x00\x00\x00\x00' : '\x10\x00\x00\x00') + // external file attributes
        convertDecToHex(offset, 4) + // relative offset of local header
        utfPath + // file name
        extraFields; // extra field

    return {
        localFileHeader: Uint8Array.from(localFileHeader, (c) => c.charCodeAt(0)),
        centralDirectoryHeader: Uint8Array.from(centralDirectoryHeader, (c) => c.charCodeAt(0)),
    };
};

const getDecodedContent = (
    content: string | Uint8Array
): {
    size: number;
    content: Uint8Array;
} => {
    let contentToUse: Uint8Array;
    // base64 content is passed as string
    if (typeof content === 'string') {
        const base64String = atob(content.split(';base64,')[1]);
        contentToUse = Uint8Array.from(base64String, (c) => c.charCodeAt(0));
    } else {
        contentToUse = content;
    }

    return {
        size: contentToUse.length,
        content: contentToUse,
    };
};

export const getDeflatedHeaderAndContent = async (currentFile: ZipFile, offset: number): Promise<ProcessedZipFile> => {
    const { content } = currentFile;

    const { size, content: rawContent } = !content
        ? { size: 0, content: Uint8Array.from([]) }
        : getDecodedContent(content);

    let deflatedContent: Uint8Array | undefined = undefined;
    let deflatedSize: number | undefined = undefined;
    let deflationPerformed = false;

    const shouldDeflate = currentFile.type === 'file' && rawContent && size > 0;
    if (shouldDeflate) {
        const result = await deflateLocalFile(rawContent);
        deflatedContent = result.content;
        deflatedSize = result.size;
        deflationPerformed = true;
    }

    const headers = getHeaders(currentFile, deflationPerformed, offset, size, rawContent, deflatedSize);

    return {
        ...headers,
        content: deflatedContent || rawContent,
        isCompressed: deflationPerformed,
    };
};

export const getHeaderAndContent = (currentFile: ZipFile, offset: number): ProcessedZipFile => {
    const { content } = currentFile;

    const { content: rawContent } = !content ? { content: Uint8Array.from([]) } : getDecodedContent(content);

    const headers = getHeaders(currentFile, false, offset, rawContent.length, rawContent, undefined);

    return {
        ...headers,
        content: rawContent,
        isCompressed: false,
    };
};

export const buildCentralDirectoryEnd = (tLen: number, cLen: number, lLen: number): Uint8Array => {
    const str =
        'PK\x05\x06' + // central folder end
        '\x00\x00' +
        '\x00\x00' +
        convertDecToHex(tLen, 2) + // total number of entries in the central folder
        convertDecToHex(tLen, 2) + // total number of entries in the central folder
        convertDecToHex(cLen, 4) + // size of the central folder
        convertDecToHex(lLen, 4) + // central folder start offset
        '\x00\x00';

    return Uint8Array.from(str, (c) => c.charCodeAt(0));
};
