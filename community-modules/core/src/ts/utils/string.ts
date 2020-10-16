const reUnescapedHtml = /[&<>"']/g;

/**
 * HTML Escapes.
 */
const HTML_ESCAPES: { [id: string]: string; } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/**
 * It encodes any string in UTF-8 format
 * taken from https://github.com/mathiasbynens/utf8.js
 * @param {string} s
 * @returns {string}
 */
export function utf8_encode(s: string): string {
    const stringFromCharCode = String.fromCharCode;

    function ucs2decode(string: string): number[] {
        const output: number[] = [];
        const len = string.length;

        let counter = 0;
        let value;
        let extra;

        while (counter < len) {
            value = string.charCodeAt(counter++);
            if (value >= 0xD800 && value <= 0xDBFF && counter < len) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt(counter++);
                if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
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
        if (point >= 0xD800 && point <= 0xDFFF) {
            throw Error(
                'Lone surrogate U+' + point.toString(16).toUpperCase() +
                ' is not a scalar value'
            );
        }
    }

    function createByte(point: number, shift: number) {
        return stringFromCharCode(((point >> shift) & 0x3F) | 0x80);
    }

    function encodeCodePoint(point: number) {
        if ((point & 0xFFFFFF80) == 0) { // 1-byte sequence
            return stringFromCharCode(point);
        }
        let symbol = '';

        if ((point & 0xFFFFF800) == 0) { // 2-byte sequence
            symbol = stringFromCharCode(((point >> 6) & 0x1F) | 0xC0);
        } else if ((point & 0xFFFF0000) == 0) { // 3-byte sequence
            checkScalarValue(point);
            symbol = stringFromCharCode(((point >> 12) & 0x0F) | 0xE0);
            symbol += createByte(point, 6);
        } else if ((point & 0xFFE00000) == 0) { // 4-byte sequence
            symbol = stringFromCharCode(((point >> 18) & 0x07) | 0xF0);
            symbol += createByte(point, 12);
            symbol += createByte(point, 6);
        }
        symbol += stringFromCharCode((point & 0x3F) | 0x80);
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

/**
 * Converts a camelCase string into hyphenated string
 * from https://gist.github.com/youssman/745578062609e8acac9f
 * @param {string} str
 * @return {string}
 */
export function camelCaseToHyphen(str: string): string | null {
    if (str === null || str === undefined) { return null; }

    return str.replace(/([A-Z])/g, (g) => '-' + g[0].toLowerCase());
}

/**
 * Converts a hyphenated string into camelCase string
 * from https://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
 * @param {string} str
 * @return {string}
 */
export function hyphenToCamelCase(str: string): string | null {
    if (str === null || str === undefined) {
        return null;
    }
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function capitalise(str: string): string {
    return str[0].toUpperCase() + str.substr(1).toLowerCase();
}

export function escapeString(toEscape: string | null): string | null {
    return toEscape == null || !toEscape.replace ? toEscape : toEscape.replace(reUnescapedHtml, chr => HTML_ESCAPES[chr]);
}

/**
 * Converts a camelCase string into regular text
 * from: https://stackoverflow.com/questions/15369566/putting-space-in-camel-case-string-using-regular-expression
 * @param {string} camelCase
 * @return {string}
 */
export function camelCaseToHumanText(camelCase: string | undefined): string | null {
    if (!camelCase || camelCase == null) { return null; }

    const rex = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
    const words: string[] = camelCase.replace(rex, '$1$4 $2$3$5').replace('.', ' ').split(' ');

    return words.map(word => word.substring(0, 1).toUpperCase() + ((word.length > 1) ? word.substring(1, word.length) : '')).join(' ');
}

export function startsWith(str: string, matchStart: string): boolean {
    if (str === matchStart) { return true; }

    return str != null && str.slice(0, matchStart.length) === matchStart;
}
