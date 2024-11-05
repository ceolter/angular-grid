import { BASE_URL } from '../baseUrl';
import { _errorOnce, _warnOnce } from '../utils/function';
import { VERSION } from '../version';
import type { ErrorId, ErrorMap, GetErrorParams } from './errorMessages/errorText';
import type { ValidationService } from './validationService';

const MAX_URL_LENGTH = 2000;
const MIN_PARAM_LENGTH = 100;
const VERSION_PARAM_NAME = '_version_';

let validation: ValidationService | null = null;
let suppressAllLogging = false;
let baseDocLink = `${BASE_URL}/javascript-data-grid`;
/**
 * The ValidationService passes itself in if it has been included.
 * @param logger
 */
export function provideValidationServiceLogger(logger: ValidationService) {
    validation = logger;
}
export function suppressAllLogs() {
    suppressAllLogging = true;
}
/** Set by the Framework override to give us accurate links for the framework  */
export function setValidationDocLink(docLink: string) {
    baseDocLink = docLink;
}

type LogFn = (message: string, ...args: any[]) => void;

function getErrorParts<TId extends ErrorId>(id: TId, args: GetErrorParams<TId>, defaultMessage?: string): any[] {
    return validation?.getConsoleMessage(id, args) ?? [minifiedLog(id, args, defaultMessage)];
}

function getMsgOrDefault<TId extends ErrorId>(
    logger: LogFn,
    id: TId,
    args: GetErrorParams<TId>,
    defaultMessage?: string
) {
    if (suppressAllLogging) return;
    logger(`error #${id}`, ...getErrorParts(id, args, defaultMessage));
}

/**
 * Stringify object, removing any circular dependencies
 */
function stringifyObject(inputObj: any) {
    const object: Record<string, any> = {};

    for (const prop of Object.keys(inputObj)) {
        if (typeof inputObj[prop] !== 'object' && typeof inputObj[prop] !== 'function') {
            object[prop] = inputObj[prop];
        }
    }
    return JSON.stringify(object);
}

function stringifyValue(value: any) {
    let output = value;
    if (value instanceof Error) {
        output = value.toString();
    } else if (typeof value === 'object') {
        output = stringifyObject(value);
    }
    return output;
}
/**
 * Correctly formats a string or undefined or null value into a human readable string
 * @param input
 */
export function toStringWithNullUndefined(str: string | null | undefined) {
    return str === undefined ? 'undefined' : str === null ? 'null' : str;
}

function getParamsUrl(baseUrl: string, params: URLSearchParams) {
    return `${baseUrl}?${params.toString()}`;
}

function truncateUrl(baseUrl: string, params: URLSearchParams, maxLength: number) {
    const sortedParams = Array.from(params.entries()).sort((a, b) => b[1].length - a[1].length);
    let url = getParamsUrl(baseUrl, params);

    for (const [key, value] of sortedParams) {
        if (key === VERSION_PARAM_NAME) {
            continue;
        }
        const excessLength = url.length - maxLength;
        if (excessLength <= 0) {
            break;
        }

        const ellipse = '...';
        const truncateAmount = excessLength + ellipse.length;
        // Truncate by `truncateAmount`, unless the result is shorter than the min param
        // length. In which case, shorten to min param length, then continue shortening
        // other params.
        // Assume there isn't a lot of params that are all long.
        const truncatedValue =
            value.length - truncateAmount > MIN_PARAM_LENGTH
                ? value.slice(0, value.length - truncateAmount) + ellipse
                : value.slice(0, MIN_PARAM_LENGTH) + ellipse;

        params.set(key, truncatedValue);
        url = getParamsUrl(baseUrl, params);
    }

    return url;
}

export function getErrorLink(errorNum: ErrorId, args: GetErrorParams<any>) {
    const params = new URLSearchParams();
    params.append(VERSION_PARAM_NAME, VERSION);
    if (args) {
        Object.entries(args).forEach(([key, value]) => {
            params.append(key, stringifyValue(value));
        });
    }
    const baseUrl = `${baseDocLink}/errors/${errorNum}`;
    const url = getParamsUrl(baseUrl, params);

    return url.length <= MAX_URL_LENGTH ? url : truncateUrl(baseUrl, params, MAX_URL_LENGTH);
}

const minifiedLog = (errorNum: ErrorId, args: GetErrorParams<any>, defaultMessage?: string) => {
    const errorLink = getErrorLink(errorNum, args);
    return `${defaultMessage ? defaultMessage + ' \n' : ''}Visit ${errorLink}${defaultMessage ? '' : ' \n  Alternatively register the ValidationModule to see the full message in the console.'}`;
};

export function _warn<
    TId extends ErrorId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TShowMessageAtCallLocation = ErrorMap[TId],
>(...args: undefined extends GetErrorParams<TId> ? [id: TId] : [id: TId, params: GetErrorParams<TId>]): void {
    getMsgOrDefault(_warnOnce, args[0], args[1] as any);
}

export function _error<
    TId extends ErrorId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TShowMessageAtCallLocation = ErrorMap[TId],
>(...args: undefined extends GetErrorParams<TId> ? [id: TId] : [id: TId, params: GetErrorParams<TId>]): void {
    getMsgOrDefault(_errorOnce, args[0], args[1] as any);
}

/** Used for messages before the ValidationService has been created */
export function _logPreCreationError<
    TId extends ErrorId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TShowMessageAtCallLocation = ErrorMap[TId],
>(id: TId, args: GetErrorParams<TId>, defaultMessage: string) {
    getMsgOrDefault(_errorOnce, id!, args as any, defaultMessage);
}

export function _errMsg<
    TId extends ErrorId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TShowMessageAtCallLocation = ErrorMap[TId],
>(...args: undefined extends GetErrorParams<TId> ? [id: TId] : [id: TId, params: GetErrorParams<TId>]): string {
    const id = args[0];
    return `error #${id} ` + getErrorParts(id, args[1] as any).join(' ');
}
