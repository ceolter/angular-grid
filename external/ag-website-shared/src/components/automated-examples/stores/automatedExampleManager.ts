import styles from '@ag-website-shared/components/automated-examples/AutomatedExampleDebug.module.scss';
import { createAutomatedExampleManager } from '@ag-website-shared/components/automated-examples/lib/createAutomatedExampleManager';
import { getAutomatedExampleSearchParams } from '@ag-website-shared/components/automated-examples/lib/getAutomatedExampleSearchParams';
import { atom } from 'nanostores';

function initAutomatedExampleManager() {
    const automatedExampleManager = createAutomatedExampleManager({
        debugCanvasClassname: styles.automatedExampleDebugCanvas,
        debugPanelClassname: styles.automatedExampleDebugPanel,
    });
    const { debugValue, debugLogLevel } = getAutomatedExampleSearchParams();

    automatedExampleManager.setDebugEnabled(Boolean(debugValue));
    automatedExampleManager.setDebugLogLevel(debugLogLevel);
    automatedExampleManager.setDebugInitialDraw(debugValue === 'draw');

    return automatedExampleManager;
}

export const $automatedExampleManager = atom(initAutomatedExampleManager());
