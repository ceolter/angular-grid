import { createAutomatedExampleManager } from '@ag-website-shared/components/automated-examples/lib/createAutomatedExampleManager';
import styles from '@pages-styles/homepage.module.scss';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import type { FunctionComponent } from 'react';

import { AutomatedIntegratedCharts } from './AutomatedIntegratedCharts';
import { AutomatedRowGrouping } from './AutomatedRowGrouping';
import type { LogLevel } from './lib/scriptDebugger';

export const AutomatedExamples: FunctionComponent = () => {
    const [isCI, setIsCI] = useState(false);
    const [runOnce, setRunOnce] = useState(false);
    const automatedExampleManager = useMemo(
        () =>
            createAutomatedExampleManager({
                debugCanvasClassname: styles.automatedExampleDebugCanvas,
                debugPanelClassname: styles.automatedExampleDebugPanel,
            }),
        []
    );

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const debugValue = searchParams.get('debug');
        const debugLogLevel = searchParams.get('debugLogLevel') as LogLevel;
        setIsCI(searchParams.get('isCI') === 'true');
        setRunOnce(searchParams.get('runOnce') === 'true');

        automatedExampleManager.setDebugEnabled(Boolean(debugValue));
        automatedExampleManager.setDebugLogLevel(debugLogLevel);
        automatedExampleManager.setDebugInitialDraw(debugValue === 'draw');
    }, []);

    return (
        <>
            <section className={styles.automatedRowGroupingOuter}>
                <div className={classNames(styles.homepageExample)}>
                    <div className={styles.automatedRowGrouping}>
                        <AutomatedRowGrouping
                            automatedExampleManager={automatedExampleManager}
                            useStaticData={isCI}
                            runOnce={runOnce}
                            visibilityThreshold={0.2}
                            darkMode={true}
                        />
                    </div>
                </div>
            </section>

            <section className={styles.automatedIntegratedChartsOuter}>
                <div className={classNames(styles.homepageExample)}>
                    <div className={styles.automatedIntegratedCharts}>
                        <AutomatedIntegratedCharts
                            automatedExampleManager={automatedExampleManager}
                            useStaticData={isCI}
                            runOnce={runOnce}
                            visibilityThreshold={0.8}
                        >
                            <div className={styles.sectionContent}>
                                <header className={styles.headingContainer}>
                                    <h2 className={styles.tag}>Fully Integrated Charting</h2>
                                    <h3 className={styles.heading}>Integrated Charts, Powered by AG Charts</h3>
                                    <h4 className={styles.subHeading}>
                                        Let your users visualise their data in charts directly from your Data Grid.
                                        Multiple chart types, themes, customisations and more, all in one place.
                                    </h4>
                                    <a href="/react-data-grid/getting-started/" className="button-tertiary">
                                        Learn more
                                    </a>
                                </header>
                                <div className={styles.blueRectangle}></div>
                            </div>
                        </AutomatedIntegratedCharts>
                    </div>
                </div>
            </section>
        </>
    );
};
