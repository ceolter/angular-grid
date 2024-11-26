import type { Group } from '@tweenjs/tween.js';

import type { GridApi } from 'ag-grid-community';

import type { Mouse } from '../../lib/createMouse';
import { removeDragAndDropHandles } from '../../lib/scriptActions/removeDragAndDropHandles';
import type { ScriptDebugger } from '../../lib/scriptDebugger';
import { createScriptRunner as createScriptRunnerCore } from '../../lib/scriptRunner';
import type { RunScriptState } from '../../lib/scriptRunner';
import type { EasingFunction } from '../../lib/tween';
import { createScript } from './createScript';

interface Params {
    id: string;
    mouse: Mouse;
    containerEl: HTMLElement;
    getContainerScale?: () => number;
    getOverlay: () => HTMLElement;
    onStateChange?: (state: RunScriptState) => void;
    tweenGroup: Group;
    gridApi: GridApi;
    loop?: boolean;
    scriptDebugger?: ScriptDebugger;
    defaultEasing?: EasingFunction;
}

export function createScriptRunner({
    id,
    containerEl,
    getContainerScale,
    getOverlay,
    mouse,
    onStateChange,
    tweenGroup,
    gridApi,
    loop,
    scriptDebugger,
    defaultEasing,
}: Params) {
    const script = createScript({
        containerEl,
        getContainerScale,
        mouse,
        tweenGroup,
        scriptDebugger,
    });

    const scriptRunner = createScriptRunnerCore({
        id,
        containerEl,
        getOverlay,
        mouse,
        script,
        gridApi,
        loop,
        tweenGroup,
        onStateChange: (state) => {
            scriptDebugger?.log(`${id} state: ${state}`);

            if (state === 'stopping' || state === 'inactive' || state === 'errored') {
                mouse.hide();
                removeDragAndDropHandles();
            }

            onStateChange?.(state);
        },
        scriptDebugger,
        defaultEasing,
    });
    scriptDebugger?.setScriptRunner(scriptRunner);

    return scriptRunner;
}
