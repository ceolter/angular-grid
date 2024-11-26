import type { LogLevel } from '@ag-website-shared/components/automated-examples/lib/scriptDebugger';

export function getAutomatedExampleSearchParams() {
    if (!globalThis.window) {
        return {};
    }

    const searchParams = new URLSearchParams(window.location.search);
    const debugValue = searchParams.get('debug');
    const debugLogLevel = searchParams.get('debugLogLevel') as LogLevel;

    const isCI = searchParams.get('isCI') === 'true';
    const runOnce = searchParams.get('runOnce') === 'true';

    return {
        debugValue,
        debugLogLevel,
        isCI,
        runOnce,
    };
}
