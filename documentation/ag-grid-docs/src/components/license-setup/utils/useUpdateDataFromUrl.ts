import type { Library } from '@ag-grid-types';
import { useEffect } from 'react';

import { updateSearchParams } from './updateSearchParams';

export const useUpdateDataFromUrl = ({
    library,
    setIsIntegratedCharts,
}: {
    library: Library;
    setIsIntegratedCharts: React.Dispatch<boolean>;
}) => {
    useEffect(() => {
        const newSearchParams = {} as { integratedCharts: boolean };

        if (library === 'grid') {
            const searchParams = new URLSearchParams(window.location.search);
            const integratedChartsParam = searchParams.get('integratedCharts');

            if (integratedChartsParam) {
                if (integratedChartsParam === 'true') {
                    setIsIntegratedCharts(true);
                    newSearchParams.integratedCharts = true;
                } else {
                    setIsIntegratedCharts(false);
                }
            }
        } else {
            newSearchParams.integratedCharts = false;
        }

        if (Object.keys(newSearchParams).length) {
            updateSearchParams(newSearchParams);
        }
    }, [library]);
};
