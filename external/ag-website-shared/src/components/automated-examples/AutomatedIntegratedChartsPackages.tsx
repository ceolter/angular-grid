import { createAutomatedIntegratedCharts } from '@ag-website-shared/components/automated-examples/examples/integrated-charts/indexPackages';
import { throwDevWarning } from '@ag-website-shared/utils/throwDevWarning';
import { GRID_STAGING_SITE_URL, agChartsVersion, agGridVersion } from '@constants';
import { getIsArchive, getIsProduction } from '@utils/env';
import { useIntersectionObserver } from '@utils/hooks/useIntersectionObserver';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useCallback, useRef, useState } from 'react';

import { AutomatedIntegratedChartsWithCreate } from './AutomatedIntegratedChartsWithCreate';
import type { AutomatedIntegratedChartsProps } from './AutomatedIntegratedChartsWithCreate';

const isProduction = getIsProduction();
const isArchive = getIsArchive();

const AG_GRID_CDN_URL = isArchive
    ? `https://www.ag-grid.com/archive/${agGridVersion}/files/ag-grid-enterprise/dist/ag-grid-enterprise.min.js`
    : isProduction
      ? `https://cdn.jsdelivr.net/npm/ag-grid-enterprise@${agGridVersion}/dist/ag-grid-enterprise.min.js`
      : `${GRID_STAGING_SITE_URL}/files/ag-grid-enterprise/dist/ag-grid-enterprise.min.js`;

const AG_CHARTS_CDN_URL = isProduction
    ? `https://cdn.jsdelivr.net/npm/ag-charts-enterprise@${agChartsVersion}/dist/umd/ag-charts-enterprise.min.js`
    : urlWithBaseUrl('/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js');

/**
 * Load automated integrated charts example using packages
 */
export function AutomatedIntegratedChartsWithPackages(props: AutomatedIntegratedChartsProps) {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useIntersectionObserver({
        elementRef: containerRef,
        onChange: ({ isIntersecting, disconnect }) => {
            if (isIntersecting && !isLoaded) {
                loadBundles();
                disconnect();
            }
        },
        threshold: 0,
    });

    const loadBundles = useCallback(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = () => {
                    reject(new Error(`Failed to load script: ${src}`));
                };
                document.body.appendChild(script);
            });
        };

        Promise.all([loadScript(AG_CHARTS_CDN_URL), loadScript(AG_GRID_CDN_URL)])
            .then(() => {
                setIsLoaded(true);
            })
            .catch((error) => {
                throwDevWarning({ message: error.message });
            });
    }, []);

    return (
        <div ref={containerRef}>
            {isLoaded && (
                <AutomatedIntegratedChartsWithCreate
                    createAutomatedIntegratedCharts={createAutomatedIntegratedCharts}
                    {...props}
                />
            )}
        </div>
    );
}
