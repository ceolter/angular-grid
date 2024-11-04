import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import type { FileContents } from '@components/example-generator/types';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';

import { CodeViewer } from './CodeViewer';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';

interface Props {
    id: string;
    title: string;
    exampleUrl?: string;
    exampleRunnerExampleUrl?: string;
    externalLinks?: ReactElement;
    exampleHeight?: number;
    exampleFiles?: FileContents;
    initialSelectedFile?: string;
    internalFramework: InternalFramework;
    hideInternalFrameworkSelection?: boolean;
    loadingIFrameId: string;
    supportedFrameworks: InternalFramework[];
    suppressDarkMode?: boolean;
}

const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    title,
    exampleUrl,
    exampleRunnerExampleUrl,
    externalLinks,
    exampleHeight: initialExampleHeight,
    exampleFiles,
    initialSelectedFile,
    internalFramework,
    hideInternalFrameworkSelection,
    loadingIFrameId,
    supportedFrameworks,
    suppressDarkMode,
}) => {
    const [showCode, setShowCode] = useState(false);

    const exampleHeight = initialExampleHeight || DEFAULT_HEIGHT;
    return (
        <div id={id} className={styles.exampleOuter}>
            <div className={styles.tabsContainer}>
                <div
                    className={styles.content}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight, width: '100%' }}
                >
                    <ExampleIFrame
                        title={title}
                        isHidden={showCode}
                        url={exampleRunnerExampleUrl!}
                        loadingIFrameId={loadingIFrameId}
                        suppressDarkMode={suppressDarkMode}
                    />
                    {exampleFiles && (
                        <CodeViewer
                            id={id}
                            isActive={showCode}
                            files={exampleFiles}
                            initialSelectedFile={initialSelectedFile!}
                            internalFramework={internalFramework}
                            hideInternalFrameworkSelection={hideInternalFrameworkSelection}
                            supportedFrameworks={supportedFrameworks}
                        />
                    )}
                </div>
                <footer className={styles.footer}>
                    <button
                        className={classnames(styles.previewCodeToggle, 'button-secondary')}
                        onClick={() => {
                            setShowCode(!showCode);
                        }}
                    >
                        {showCode && (
                            <span>
                                <Icon name="eye" /> Preview
                            </span>
                        )}
                        {!showCode && (
                            <span>
                                <Icon name="code" /> Code
                            </span>
                        )}
                    </button>

                    <ul className={classnames('list-style-none', styles.externalLinks)}>
                        <li>
                            <OpenInCTA type="newTab" href={exampleUrl!} />
                        </li>
                        {externalLinks}
                    </ul>
                </footer>
            </div>
        </div>
    );
};
