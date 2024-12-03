import { OverlayButton } from '@ag-website-shared/components/automated-examples/OverlayButton';
import { ToggleAutomatedExampleButton } from '@ag-website-shared/components/automated-examples/ToggleAutomatedExampleButton';
import { UpdateSpeedSlider } from '@ag-website-shared/components/automated-examples/UpdateSpeedSlider';
import { createAutomatedRowGrouping } from '@ag-website-shared/components/automated-examples/examples/row-grouping';
import { ROW_GROUPING_ID } from '@ag-website-shared/components/automated-examples/lib/constants';
import LogoMark from '@components/logo/LogoMark';
import { useStore } from '@nanostores/react';
import { trackHomepageExampleRowGrouping, trackOnceHomepageExampleRowGrouping } from '@utils/analytics';
import { useIntersectionObserver } from '@utils/hooks/useIntersectionObserver';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';

import automatedExamplesVars from './AutomatedExamplesVars.module.scss';
import styles from './AutomatedRowGrouping.module.scss';
import type { AutomatedExampleManager } from './lib/createAutomatedExampleManager';
import { getAutomatedExampleSearchParams } from './lib/getAutomatedExampleSearchParams';
import { isMobile } from './lib/isMobile';
import { $automatedExampleManager } from './stores/automatedExampleManager';

const AUTOMATED_EXAMPLE_MOBILE_SCALE = parseFloat(automatedExamplesVars['mobile-grid-scale']);

interface Props {
    automatedExampleManager: AutomatedExampleManager;
    visibilityThreshold: number;
    darkMode: boolean;
}

export function AutomatedRowGrouping({ visibilityThreshold, darkMode }: Props) {
    const exampleId = ROW_GROUPING_ID;
    const gridClassname = 'automated-row-grouping-grid';
    const gridRef = useRef(null);
    const exampleRef = useRef(null);
    const overlayRef = useRef(null);
    const automatedExampleManager = useStore($automatedExampleManager);
    const [scriptIsEnabled, setScriptIsEnabled] = useState(true);
    const [gridIsReady, setGridIsReady] = useState(false);
    const [gridIsHoveredOver, setGridIsHoveredOver] = useState(false);
    const [frequency, setFrequency] = useState(1);
    const debuggerManager = automatedExampleManager?.getDebuggerManager();
    const { isCI: useStaticData, runOnce } = getAutomatedExampleSearchParams();

    const setAllScriptEnabledVars = (isEnabled) => {
        setScriptIsEnabled(isEnabled);
        automatedExampleManager.setEnabled({ id: exampleId, isEnabled });
    };
    const updateFrequency = useCallback((value) => {
        if (!exampleRef.current) {
            return;
        }
        exampleRef.current.setUpdateFrequency(value);
        setFrequency(value);

        trackOnceHomepageExampleRowGrouping({
            type: 'updatedFrequency',
        });
    }, []);
    const gridInteraction = useCallback(() => {
        if (!scriptIsEnabled) {
            trackOnceHomepageExampleRowGrouping({
                type: 'interactedWithGrid',
            });
        }
    }, [scriptIsEnabled]);

    useIntersectionObserver({
        elementRef: gridRef,
        onChange: ({ isIntersecting }) => {
            if (isIntersecting) {
                debuggerManager.log(`${exampleId} intersecting - start`);
                automatedExampleManager.start(exampleId);

                trackOnceHomepageExampleRowGrouping({
                    type: 'hasStarted',
                });
            } else {
                debuggerManager.log(`${exampleId} not intersecting - inactive`);
                automatedExampleManager.inactive(exampleId);
            }
        },
        threshold: visibilityThreshold,
        isDisabled: !gridIsReady,
    });

    useEffect(() => {
        const params = {
            gridClassname,
            darkMode,
            getOverlay: () => {
                return overlayRef.current;
            },
            getContainerScale: () => {
                return isMobile() ? AUTOMATED_EXAMPLE_MOBILE_SCALE : 1;
            },
            mouseMaskClassname: styles.mouseMask,
            scriptDebuggerManager: debuggerManager,
            suppressUpdates: useStaticData,
            useStaticData,
            runOnce,
            additionalContextMenuItems: [
                {
                    name: 'Replay Demo',
                    action: () => {
                        setAllScriptEnabledVars(true);
                        automatedExampleManager.start(exampleId);
                    },
                    icon: `<img src="${urlWithBaseUrl('/images/automated-examples/replay-demo-icon.svg')}" />`,
                },
            ],
            onStateChange(state) {
                if (state === 'errored') {
                    setAllScriptEnabledVars(false);
                    automatedExampleManager.errored(exampleId);
                }
            },
            onDataReady() {
                setGridIsReady(true);
            },
            visibilityThreshold,
        };

        exampleRef.current = createAutomatedRowGrouping(params);
        automatedExampleManager.add({
            id: exampleId,
            automatedExample: exampleRef.current,
        });
    }, []);

    useEffect(() => {
        if (!exampleRef.current) {
            return;
        }
        exampleRef.current.updateDarkMode(darkMode);
    }, [darkMode]);

    return (
        <>
            <div
                ref={gridRef}
                className={classNames('automated-row-grouping-grid', {
                    'ag-theme-quartz': !darkMode,
                    'ag-theme-quartz-dark': darkMode,
                })}
                onClick={gridInteraction}
            >
                <OverlayButton
                    ref={overlayRef}
                    ariaLabel="Give me control"
                    isHidden={!scriptIsEnabled}
                    onPointerEnter={() => setGridIsHoveredOver(true)}
                    onPointerOut={() => setGridIsHoveredOver(false)}
                    onClick={() => {
                        setAllScriptEnabledVars(false);
                        automatedExampleManager.stop(exampleId);

                        trackHomepageExampleRowGrouping({
                            type: 'controlGridClick',
                            clickType: 'overlay',
                        });
                    }}
                />
                {!gridIsReady && !useStaticData && <LogoMark isSpinning />}
            </div>

            <footer className={styles.sectionFooter}>
                <div className={classNames(styles.exploreButtonOuter, 'text-lg')}>
                    <span className="text-secondary">Live example:</span>
                    <ToggleAutomatedExampleButton
                        onClick={() => {
                            if (scriptIsEnabled) {
                                setAllScriptEnabledVars(false);
                                automatedExampleManager.stop(exampleId);
                            } else {
                                setAllScriptEnabledVars(true);
                                automatedExampleManager.start(exampleId);
                            }

                            trackHomepageExampleRowGrouping({
                                type: 'controlGridClick',
                                clickType: 'button',
                                value: scriptIsEnabled ? 'stop' : 'start',
                            });
                        }}
                        isHoveredOver={gridIsHoveredOver}
                        scriptIsActive={scriptIsEnabled}
                    ></ToggleAutomatedExampleButton>
                </div>

                <UpdateSpeedSlider
                    min={0}
                    max={4}
                    step={0.1}
                    value={frequency}
                    disabled={!gridIsReady}
                    setValue={updateFrequency}
                />
            </footer>
        </>
    );
}
