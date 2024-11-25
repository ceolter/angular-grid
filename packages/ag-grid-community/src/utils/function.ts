import type { GridOptionsService } from '../gridOptionsService';

const doOnceFlags: { [key: string]: boolean } = {};

/**
 * If the key was passed before, then doesn't execute the func
 * @param {Function} func
 * @param {string} key
 */
export function _doOnce(func: () => void, key: string) {
    if (doOnceFlags[key]) {
        return;
    }

    func();
    doOnceFlags[key] = true;
}

export function _logIfDebug(gos: GridOptionsService, message: string, ...args: any[]) {
    if (gos.get('debug')) {
        // eslint-disable-next-line no-console
        console.log('AG Grid: ' + message, ...args);
    }
}

export function _warnOnce(msg: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    _doOnce(() => console.warn('AG Grid: ' + msg, ...args), msg + args?.join(''));
}
export function _errorOnce(msg: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    _doOnce(() => console.error('AG Grid: ' + msg, ...args), msg + args?.join(''));
}

const executeNextVMTurnFuncs: ((...args: any[]) => any)[] = [];
let executeNextVMTurnPending = false;

export function _executeNextVMTurn(func: () => void): void {
    executeNextVMTurnFuncs.push(func);

    if (executeNextVMTurnPending) {
        return;
    }

    executeNextVMTurnPending = true;
    window.setTimeout(() => {
        const funcsCopy = executeNextVMTurnFuncs.slice();
        executeNextVMTurnFuncs.length = 0;
        executeNextVMTurnPending = false;
        funcsCopy.forEach((func) => func());
    }, 0);
}

/**
 * Creates a debounced function a function, and attach it to a bean for lifecycle
 * @param {Function} func The function to be debounced
 * @param {number} delay The time in ms to debounce
 * @return {Function} The debounced function
 */
export function _debounce(
    bean: { isAlive(): boolean },
    func: (...args: any[]) => void,
    delay: number
): (...args: any[]) => void {
    let timeout: any;

    // Calling debounce returns a new anonymous function
    return function (...args: any[]) {
        //@ts-expect-error no implicit this
        const context = this as any;
        window.clearTimeout(timeout);

        // Set the new timeout
        timeout = window.setTimeout(function () {
            // at the moment we just check if the bean is still alive, in the future the bean stub should
            // another option is to manage a list of active timers and clear them when the bean is destroyed.
            if (bean.isAlive()) {
                func.apply(context, args);
            }
        }, delay);
    };
}

/**
 * @param {Function} func The function to be throttled
 * @param {number} wait The time in ms to throttle
 * @return {Function} The throttled function
 */
export function _throttle(func: (...args: any[]) => void, wait: number): (...args: any[]) => void {
    let previousCall = 0;

    return function (...args: any[]) {
        //@ts-expect-error no implicit this
        const context = this;
        const currentCall = new Date().getTime();

        if (currentCall - previousCall < wait) {
            return;
        }

        previousCall = currentCall;

        func.apply(context, args);
    };
}

export function _waitUntil(
    condition: () => boolean,
    callback: () => void,
    timeout: number = 100,
    timeoutMessage?: string
) {
    const timeStamp = new Date().getTime();

    let interval: number | null = null;
    let executed: boolean = false;

    const internalCallback = () => {
        const reachedTimeout = new Date().getTime() - timeStamp > timeout;
        if (condition() || reachedTimeout) {
            callback();
            executed = true;
            if (interval != null) {
                window.clearInterval(interval);
                interval = null;
            }

            if (reachedTimeout && timeoutMessage) {
                _warnOnce(timeoutMessage);
            }
        }
    };

    internalCallback();

    if (!executed) {
        interval = window.setInterval(internalCallback, 10);
    }
}
