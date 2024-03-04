import type { Framework } from '@ag-grid-types';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { Icon } from '@components/icon/Icon';
import styles from '@design-system/modules/Header.module.scss';
import { getFrameworkDisplayText } from '@utils/framework';
import { useUpdateInternalFrameworkFromFramework } from '@utils/hooks/useUpdateInternalFrameworkFromFramework';
import type { FunctionComponent } from 'react';

interface Props {
    title: string;
    framework: Framework;
    isEnterprise?: boolean;
    suppressFrameworkHeader?: boolean;
    path: string;
}

export const Header: FunctionComponent<Props> = ({ title, framework, isEnterprise, suppressFrameworkHeader, path }) => {
    // Update localstorage framework so it is in sync with url framework
    // Done here, because it's run on all docs pages
    useUpdateInternalFrameworkFromFramework(framework);

    return (
        <header className={styles.docsPageHeader}>
            <h1 id="top" className={styles.docsPageTitle}>
                <div className={styles.pageTitleContainer}>
                    <div className={styles.pageTitleGroup}>
                        {!suppressFrameworkHeader && (
                            <span className={styles.headerFramework}>
                                {getFrameworkDisplayText(framework)} Data Grid
                            </span>
                        )}
                        <span>{title}</span>
                    </div>

                    <FrameworkSelectorInsideDocs path={path} currentFramework={framework} />
                </div>

                {isEnterprise && (
                    <span className={styles.enterpriseLabel}>
                        Enterprise
                        <Icon name="enterprise" />
                    </span>
                )}
            </h1>
        </header>
    );
};
