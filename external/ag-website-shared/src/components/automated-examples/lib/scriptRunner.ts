import type { Group } from '@tweenjs/tween.js';

import type { GridApi } from 'ag-grid-community';
import type { ColumnState } from 'ag-grid-community';

import { createAgElementFinder } from './agElements';
import { createAGActionCreator } from './createAGActionCreator';
import type { AGCreatorAction } from './createAGActionCreator';
import type { Mouse } from './createMouse';
import { createRowExpandedState } from './createRowExpandedState';
import type { RowExpandedState } from './createRowExpandedState';
import type { Point } from './geometry';
import type { PathItem } from './pathRecorder';
import { moveTo } from './scriptActions/move';
import { playPath } from './scriptActions/playPath';
import { removeFocus } from './scriptActions/removeFocus';
import { clearAllSingleCellSelections } from './scriptActions/singleCell';
import { waitFor } from './scriptActions/waitFor';
import type { ScriptDebugger } from './scriptDebugger';
import type { EasingFunction } from './tween';

export interface Action {
    name?: string;
    type: string;
}

export interface PathAction extends Action {
    type: 'path';
    path: PathItem<any>[];
}

export interface MoveToAction extends Action {
    type: 'moveTo';
    toPos: Point | (() => Point | undefined);
    speed?: number;
    duration?: number;
    easing?: EasingFunction;
}

export interface WaitAction extends Action {
    type: 'wait';
    duration: number;
}

export interface ClickAction extends Action {
    type: 'click';
}

export interface MouseDownAction extends Action {
    type: 'mouseDown';
}

export interface MouseUpAction extends Action {
    type: 'mouseUp';
}

export interface RemoveFocusAction extends Action {
    type: 'removeFocus';
}

export interface CustomAction extends Action {
    type: 'custom';
    action: () => Promise<void> | void;
}

export type AGAction = AGCreatorAction & {
    type: 'agAction';
} & Action;

export interface ScriptRunner {
    currentState: () => RunScriptState;
    play: (params?: { loop?: boolean }) => void;
    pause: () => void;
    stop: () => void;
    inactive: () => void;
}

export type ScriptAction =
    | PathAction
    | MoveToAction
    | WaitAction
    | RemoveFocusAction
    | ClickAction
    | MouseDownAction
    | MouseUpAction
    | CustomAction
    | AGAction;

interface PausedState {
    scriptIndex: number;
    columnState: ColumnState[];
    rowExpandedState: RowExpandedState;
}
export interface CreateScriptActionParams {
    mouse: Mouse;
    containerEl?: HTMLElement;
    getOverlay: () => HTMLElement;
    action: ScriptAction;
    gridApi: GridApi;
    tweenGroup: Group;
    scriptDebugger?: ScriptDebugger;
    defaultEasing?: EasingFunction;
}

export interface CreateScriptRunnerParams {
    id: string;
    mouse: Mouse;
    containerEl?: HTMLElement;
    getOverlay: () => HTMLElement;
    script: ScriptAction[];
    gridApi: GridApi;
    tweenGroup: Group;
    loop?: boolean;
    loopOnError?: boolean;
    onStateChange?: (state: RunScriptState) => void;
    scriptDebugger?: ScriptDebugger;
    /**
     * Default easing function used for move actions
     *
     * @see https://createjs.com/docs/tweenjs/classes/Ease.html
     */
    defaultEasing?: EasingFunction;
}

interface CreateActionSequenceRunnerParams {
    seqId: number;
    actionSequence: ReturnType<typeof createScriptActionSequence>;
    onPreAction?: (params: { action; index: number }) => { shouldCancel: boolean } | undefined;
    onError?: (params: { error: Error; action; index: number }) => void;
}

interface CreateScriptActionSequenceParams {
    script: ScriptAction[];
    containerEl?: HTMLElement;
    getOverlay: () => HTMLElement;
    mouse: Mouse;
    gridApi: GridApi;
    tweenGroup: Group;
    scriptDebugger?: ScriptDebugger;
    defaultEasing?: EasingFunction;
}

interface CancelledPromise {
    cancelled: true;
    cancelledSeqId: number;
}

export type RunScriptState = 'inactive' | 'stopped' | 'stopping' | 'errored' | 'pausing' | 'paused' | 'playing';

function createScriptAction({
    containerEl,
    getOverlay,
    mouse,
    action,
    tweenGroup,
    gridApi,
    scriptDebugger,
    defaultEasing,
}: CreateScriptActionParams) {
    const { type } = action;
    const agElementFinder = createAgElementFinder({ containerEl });
    const agActionCreator = createAGActionCreator({
        getOverlay,
        gridApi,
        agElementFinder,
        mouse,
        tweenGroup,
        defaultEasing,
        scriptDebugger,
    });

    if (type === 'path') {
        const scriptAction = action as PathAction;
        return playPath({ target: mouse.getTarget(), path: scriptAction.path });
    } else if (type === 'custom') {
        const scriptAction = action as CustomAction;
        return scriptAction.action();
    } else if (type === 'click') {
        return mouse.click();
    } else if (type === 'mouseDown') {
        return mouse.mouseDown();
    } else if (type === 'mouseUp') {
        return mouse.mouseUp();
    } else if (type === 'removeFocus') {
        return removeFocus();
    } else if (type === 'wait') {
        const scriptAction = action as WaitAction;
        return waitFor(scriptAction.duration);
    } else if (type === 'moveTo') {
        const scriptAction = action as MoveToAction;
        return moveTo({
            mouse,
            getOverlay,
            toPos: scriptAction.toPos,
            speed: scriptAction.speed,
            duration: scriptAction.duration,
            tweenGroup,
            easing: scriptAction.easing || defaultEasing,
            scriptDebugger,
        });
    } else if (type === 'agAction') {
        const scriptAction = action as AGAction;
        const params = {
            actionType: scriptAction.actionType,
            // @ts-expect-error actionParams can be empty
            actionParams: scriptAction.actionParams,
        };

        return agActionCreator(params);
    } else {
        throw new Error(`Unknown script action: ${JSON.stringify(action)}`);
    }
}

function createScriptActionSequence({
    script,
    containerEl,
    getOverlay,
    mouse,
    gridApi,
    tweenGroup,
    scriptDebugger,
    defaultEasing,
}: CreateScriptActionSequenceParams) {
    return script.map((scriptAction) => {
        return () => {
            try {
                const result = createScriptAction({
                    containerEl,
                    getOverlay,
                    mouse,
                    action: scriptAction,
                    gridApi,
                    tweenGroup,
                    scriptDebugger,
                    defaultEasing,
                });

                return result;
            } catch (error) {
                scriptDebugger?.errorLog('Script action error', {
                    scriptAction: JSON.stringify(scriptAction, function replacer(key, value) {
                        if (typeof value === 'function') {
                            return value.toString().replaceAll(/\s/gm, '').replace('function', '');
                        }
                        return value;
                    }),
                    error,
                });
                throw error;
            }
        };
    });
}

export function createScriptRunner({
    id,
    containerEl,
    getOverlay,
    mouse,
    script,
    gridApi,
    loop,
    loopOnError,
    tweenGroup,
    onStateChange,
    scriptDebugger,
    defaultEasing,
}: CreateScriptRunnerParams): ScriptRunner {
    let runScriptState: RunScriptState;
    let loopScript = loop;
    let pausedState: PausedState | undefined;
    let currentSeqId;
    const rowExpandedState = createRowExpandedState(gridApi);

    function createActionSequenceRunner({
        seqId,
        actionSequence,
        onPreAction,
        onError,
    }: CreateActionSequenceRunnerParams) {
        return new Promise((resolve, reject) => {
            let isCancelled = false;
            actionSequence
                .reduce((p, action, index) => {
                    return p
                        .then(async () => {
                            if (isCancelled) {
                                return;
                            }

                            if (seqId !== currentSeqId) {
                                isCancelled = true;
                                scriptDebugger?.log(
                                    `${id} old action sequence running - step ${index + 1}/${
                                        actionSequence.length
                                    } [${seqId}], currently ${currentSeqId}`
                                );
                                return resolve({
                                    cancelled: true,
                                    cancelledSeqId: seqId,
                                } as CancelledPromise);
                            }

                            const preActionResult = onPreAction && (await onPreAction({ action, index }));

                            if (!preActionResult?.shouldCancel) {
                                return action();
                            }
                        })
                        .catch((error) => {
                            if (seqId !== currentSeqId) {
                                isCancelled = true;
                                scriptDebugger?.log(
                                    `${id} old action sequence running - step ${index + 1}/${
                                        actionSequence.length
                                    } [${seqId}], currently ${currentSeqId}`,
                                    error
                                );
                                return resolve({
                                    cancelled: true,
                                    cancelledSeqId: seqId,
                                } as CancelledPromise);
                            }

                            onError?.({ error, index, action });
                        }) as Promise<void>;
                }, Promise.resolve())
                .then(resolve)
                .catch(reject);
        });
    }

    const setPausedState = (scriptIndex: number) => {
        pausedState = {
            scriptIndex,
            columnState: gridApi.getColumnState()!,
            rowExpandedState: rowExpandedState.get(),
        };
    };

    function tweenUpdate() {
        if (runScriptState !== 'playing') {
            return;
        }
        requestAnimationFrame(tweenUpdate);
        tweenGroup.update();
    }

    const playAgain = () => {
        let pausedScriptIndex;
        if (pausedState) {
            gridApi.applyColumnState({
                state: pausedState.columnState,
                applyOrder: true,
            });
            rowExpandedState.restore(pausedState.rowExpandedState);
            pausedScriptIndex = pausedState.scriptIndex;
            resetPausedState();
        }

        startActionSequence(pausedScriptIndex);
    };

    const resetPausedState = () => {
        pausedState = undefined;
    };

    const actionSequence = createScriptActionSequence({
        script,
        containerEl,
        getOverlay,
        mouse,
        gridApi,
        tweenGroup,
        scriptDebugger,
        defaultEasing,
    });

    const startActionSequence = (startIndex: number = 0) => {
        const seqId = Date.now();
        currentSeqId = seqId;

        updateState('playing');
        tweenUpdate();
        const scriptFromStartIndex = script.slice(startIndex);
        const sequence = createActionSequenceRunner({
            seqId,
            actionSequence: actionSequence.slice(startIndex),
            onPreAction({ index }) {
                let shouldCancel = false;

                if (runScriptState === 'stopping') {
                    updateState('stopped');
                    shouldCancel = true;
                } else if (runScriptState === 'pausing') {
                    setPausedState(index);
                    updateState('paused');
                    shouldCancel = true;
                } else if (
                    runScriptState === 'stopped' ||
                    runScriptState === 'errored' ||
                    runScriptState === 'paused' ||
                    runScriptState === 'inactive'
                ) {
                    shouldCancel = true;
                }

                if (shouldCancel) {
                    scriptDebugger?.infoLog(`${id} cancelling step from state: ${runScriptState} [${seqId}]`);
                } else {
                    const scriptAction = scriptFromStartIndex[index];
                    const stepName =
                        scriptAction.name ||
                        (scriptAction.type === 'agAction' ? scriptAction.actionType : scriptAction.type);
                    const stepNum = index + 1;
                    scriptDebugger?.updateStep({ step: stepNum, numSteps: scriptFromStartIndex.length, stepName });
                    scriptDebugger?.infoLog(
                        `${id} step ${stepNum}/${scriptFromStartIndex.length}: ${stepName} [${seqId}]`,
                        {
                            scriptAction,
                        }
                    );
                }

                return {
                    shouldCancel,
                };
            },
            onError({ error, index }) {
                scriptDebugger?.errorLog('Action error (stopping)', {
                    index,
                    error,
                });

                // Error in action, stop the script
                updateState('errored');
                cleanUp();
            },
        });

        sequence
            .then((result) => {
                if ((result as CancelledPromise)?.cancelled) {
                    scriptDebugger?.log(`${id} sequence cancelled [${(result as CancelledPromise).cancelledSeqId}]`);
                    return;
                }

                if (loopScript && runScriptState === 'playing') {
                    updateState('stopped');
                    startActionSequence();
                } else if (runScriptState === 'pausing') {
                    updateState('paused');
                } else if (
                    runScriptState === 'paused' ||
                    runScriptState === 'inactive' ||
                    runScriptState === 'errored'
                ) {
                    // Do nothing
                } else {
                    updateState('stopped');
                    if (loopScript && loopOnError) {
                        startActionSequence();
                    }
                }
            })
            .catch((error) => {
                scriptDebugger?.errorLog('Action sequence error', error);
                stop();
            });
    };

    const cleanUp = () => {
        resetPausedState();
        tweenGroup.removeAll();
        clearAllSingleCellSelections();
    };

    const stop: ScriptRunner['stop'] = () => {
        if (runScriptState === 'errored') {
            return;
        }

        // Initiate stop
        updateState('stopping');
        cleanUp();
    };

    const inactive: ScriptRunner['inactive'] = () => {
        updateState('inactive');
        cleanUp();
    };

    const play: ScriptRunner['play'] = ({ loop } = {}) => {
        if (runScriptState === 'playing') {
            return;
        }

        loopScript = loop === undefined ? loopScript : Boolean(loop);

        playAgain();
    };
    const pause: ScriptRunner['pause'] = () => {
        if (runScriptState === 'playing') {
            updateState('pausing');
        }
    };
    const currentState: ScriptRunner['currentState'] = (): RunScriptState => {
        return runScriptState;
    };

    const updateState = (state: RunScriptState) => {
        scriptDebugger?.updateState({
            state,
            pauseIndex: pausedState?.scriptIndex,
        });
        runScriptState = state;
        onStateChange?.(state);
    };

    // Initial playState
    updateState('stopped');

    return {
        currentState,
        play,
        pause,
        stop,
        inactive,
    };
}
