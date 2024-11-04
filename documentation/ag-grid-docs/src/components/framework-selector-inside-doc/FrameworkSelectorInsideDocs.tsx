import type { Framework, MenuItem } from '@ag-grid-types';
import { Select } from '@ag-website-shared/components/select/Select';
import fwLogos from '@ag-website-shared/images/fw-logos';
import { DOCS_FRAMEWORK_REDIRECT_PAGE } from '@components/docs/constants';
import { getPageNameFromPath } from '@components/docs/utils/urlPaths';
import { FRAMEWORKS } from '@constants';
import { getFrameworkDisplayText } from '@utils/framework';
import { getNewFrameworkPath } from '@utils/framework';
import { getMenuItemFromPageName } from '@utils/getMenuItemFromPageName';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import { useMemo } from 'react';

import styles from './FrameworkSelectorInsideDocs.module.scss';

interface Props {
    path: string;
    currentFramework: Framework;
    /**
     * Menu items used to check if the current page exists for the framework
     * to be changed to. If not provided, will just go to the page without
     * checks.
     */
    menuItems?: MenuItem[];
}

export const FrameworkSelectorInsideDocs = ({ path, currentFramework, menuItems }: Props) => {
    const frameworkOptions = useMemo(() => {
        return FRAMEWORKS.map((framework) => ({
            label: getFrameworkDisplayText(framework),
            value: framework,
        }));
    }, []);

    const frameworkOption = useMemo(
        () => frameworkOptions.find((o: { value: string }) => o.value === currentFramework) || frameworkOptions[0],
        [frameworkOptions, currentFramework]
    );

    const handleFrameworkChange = (selectedFramework: Framework) => {
        const pageName = getPageNameFromPath(path);
        const menuItem = menuItems && getMenuItemFromPageName({ menuItems, pageName });
        let newUrl = getNewFrameworkPath({
            path,
            currentFramework,
            newFramework: selectedFramework,
        });

        // Redirect to default page if page does not exist in framework
        if (menuItem?.frameworks) {
            const withinFrameworks = menuItem?.frameworks?.includes(selectedFramework);

            if (!withinFrameworks) {
                const relativeUrl = DOCS_FRAMEWORK_REDIRECT_PAGE.startsWith('./')
                    ? DOCS_FRAMEWORK_REDIRECT_PAGE
                    : `./${DOCS_FRAMEWORK_REDIRECT_PAGE}`;
                newUrl = urlWithPrefix({
                    framework: selectedFramework,
                    url: relativeUrl,
                });
            }
        }

        window.location.href = newUrl;
    };

    return (
        currentFramework && (
            <div className={styles.frameworkSelector}>
                <Select
                    isLarge
                    isPopper
                    options={frameworkOptions}
                    value={frameworkOption}
                    onChange={(newValue) => handleFrameworkChange(newValue.value as Framework)}
                    renderItem={(o) => {
                        return (
                            <span className={styles.frameworkItem}>
                                <img src={fwLogos[o.value]} alt={`${o.value} logo`} className={styles.frameworkLogo} />
                                {o.label}
                            </span>
                        );
                    }}
                />
            </div>
        )
    );
};
