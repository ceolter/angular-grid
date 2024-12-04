import { useStore } from '@nanostores/react';
import { $internalFramework, updateInternalFrameworkBasedOnFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useCallback } from 'react';

export function useFrameworkSelector() {
    const internalFramework = useStore($internalFramework);
    const framework = getFrameworkFromInternalFramework(internalFramework);

    const handleFrameworkChange = useCallback((newFramework: string) => {
        updateInternalFrameworkBasedOnFramework(newFramework);
    }, []);

    return {
        internalFramework,
        framework,
        handleFrameworkChange,
    };
}
