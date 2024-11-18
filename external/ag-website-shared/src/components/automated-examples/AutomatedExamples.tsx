import { createAutomatedExampleManager } from '@ag-website-shared/components/automated-examples/lib/createAutomatedExampleManager';
import { LandingPageSection } from '@ag-website-shared/components/landing-pages/LandingPageSection';
import styles from '@pages-styles/homepage.module.scss';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
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
            <LandingPageSection
                tag="Performance And Speed First"
                heading="The Fastest Data Grid In The World"
                subHeading="Handle millions of rows, and thousands of updates per second out of the box, without compromising on performance"
                ctaTitle="Build your first Grid"
                ctaUrl={urlWithBaseUrl('/react-data-grid/getting-started/')}
            >
                <section className={styles.automatedRowGroupingOuter}>
                    <div className={styles.automatedRowGrouping}>
                        <AutomatedRowGrouping
                            automatedExampleManager={automatedExampleManager}
                            useStaticData={isCI}
                            runOnce={runOnce}
                            visibilityThreshold={0.2}
                            darkMode={true}
                        />
                    </div>
                </section>
            </LandingPageSection>

            <LandingPageSection
                tag="Fully Integrated Charting"
                heading="Integrated Charts, Powered by AG Charts"
                subHeading="Let your users visualise their data in charts directly from your Data Grid. Multiple chart types, themes, customisations and more, all in one place."
                ctaTitle="Get started with Integrated Charts"
                ctaUrl={urlWithBaseUrl('/react-data-grid/integrated-charts/')}
            >
                <section className={styles.automatedIntegratedChartsOuter}>
                    <div className={styles.automatedIntegratedCharts}>
                        <AutomatedIntegratedCharts
                            automatedExampleManager={automatedExampleManager}
                            useStaticData={isCI}
                            runOnce={runOnce}
                            visibilityThreshold={0.8}
                        />
                    </div>
                </section>
            </LandingPageSection>
        </>
    );
};
