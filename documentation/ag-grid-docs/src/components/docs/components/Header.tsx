import type { Framework, MenuItem } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { getFrameworkDisplayText } from '@utils/framework';
import { useSyncFrameworkStoreState } from '@utils/hooks/useSyncFrameworkStoreState';
import type { FunctionComponent } from 'react';

import styles from './Header.module.scss';

interface Props {
    title: string;
    framework: Framework;
    isEnterprise?: boolean;
    suppressFrameworkHeader?: boolean;
    path: string;
    menuItems: MenuItem[];
}

export const Header: FunctionComponent<Props> = ({
    title,
    framework,
    isEnterprise,
    suppressFrameworkHeader,
    path,
    menuItems,
}) => {
    // Update framework store so it is in sync with the page
    // Done here, because it's run on all docs pages
    useSyncFrameworkStoreState(framework);

    return (
        <header className={styles.docsPageHeader}>
            <div id="top" className={styles.docsPageTitle}>
                <div className={styles.pageTitleContainer}>
                    <div className={styles.pageTitleGroup}>
                        <h1>
                            {!suppressFrameworkHeader && (
                                <span className={styles.headerFramework}>
                                    {`${getFrameworkDisplayText(framework)} Data Grid`}
                                </span>
                            )}
                            {title}
                        </h1>
                    </div>

                    <FrameworkSelectorInsideDocs path={path} currentFramework={framework} menuItems={menuItems} />
                </div>

                {isEnterprise && (
                    <span className={styles.enterpriseLabel}>
                        Enterprise
                        <Icon name="enterprise" />
                    </span>
                )}
            </div>
        </header>
    );
};
