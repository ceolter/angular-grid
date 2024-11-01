import type { MenuItem } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import MenuIcon from '@ag-website-shared/images/inline-svgs/menu-icon.svg?react';
import { Collapsible } from '@components/Collapsible';
import { getPageNameFromPath } from '@components/docs/utils/urlPaths';
import { useFrameworkFromStore } from '@utils/hooks/useFrameworkFromStore';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';
import { useState } from 'react';
import type { ReactElement } from 'react';

import { DarkModeToggle } from './DarkModeToggle';
import styles from './SiteHeader.module.scss';

/**
 * Title of api header menu
 */
const API_TITLE = 'API';

const getIsActiveNav = ({
    title,
    path,
    allPaths,
    apiPaths,
}: {
    title: string;
    path: string;
    allPaths: MenuItem[];
    apiPaths: string[];
}): boolean => {
    const allPathsMatch = allPaths.find((link) => path.includes(link.path!));
    const currentNavItem = allPathsMatch?.title;

    const pageName = getPageNameFromPath(path);
    const isApiPage = apiPaths.includes(pageName);

    const checkTitle = isApiPage ? API_TITLE : currentNavItem;
    return title === checkTitle;
};

const HeaderLinks = ({
    currentPath,
    items,
    allPaths,
    apiPaths,
    isOpen,
    toggleIsOpen,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    apiPaths: string[];
    isOpen?: boolean;
    toggleIsOpen?: () => void;
}) => {
    const framework = useFrameworkFromStore();

    return (
        <ul className={classnames(styles.navItemList, 'list-style-none')}>
            {items.map(({ title, path, url, icon }) => {
                const linkClasses = classnames(styles.navItem, {
                    [styles.navItemActive]: getIsActiveNav({ title, path: currentPath, allPaths, apiPaths }),
                    [styles.buttonItem]: title === 'Github',
                    [styles.githubItem]: title === 'Github',
                });
                const href = path
                    ? urlWithPrefix({
                          url: path,
                          framework,
                      })
                    : url;

                return (
                    <li key={title.toLocaleLowerCase()} className={linkClasses}>
                        <a
                            className={styles.navLink}
                            href={href}
                            onClick={() => {
                                if (isOpen) {
                                    toggleIsOpen && toggleIsOpen();
                                }
                            }}
                            aria-label={`AG Grid ${title}`}
                        >
                            {icon && <Icon name={icon} />}
                            <span>{title}</span>
                        </a>
                    </li>
                );
            })}

            <DarkModeToggle />
        </ul>
    );
};

const HeaderExpandButton = ({ isOpen, toggleIsOpen }: { isOpen: boolean; toggleIsOpen: () => void }) => (
    <button
        className={styles.mobileMenuButton}
        type="button"
        aria-controls={styles.mainNavSmall}
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
        onClick={() => toggleIsOpen()}
    >
        <MenuIcon className={styles.menuIcon} />
    </button>
);

const HeaderNavLarge = ({
    currentPath,
    items,
    allPaths,
    apiPaths,
    children,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    apiPaths: string[];
    children: ReactElement;
}) => {
    return (
        <div className={classnames(styles.mainNav, styles.mainNavLargeContainer)}>
            <nav className={styles.mainNavLarge}>
                <HeaderLinks currentPath={currentPath} items={items} allPaths={allPaths} apiPaths={apiPaths}>
                    {children}
                </HeaderLinks>
            </nav>
        </div>
    );
};

const HeaderNavSmall = ({
    currentPath,
    items,
    allPaths,
    apiPaths,
    isOpen,
    toggleIsOpen,
    children,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    apiPaths: string[];
    isOpen: boolean;
    toggleIsOpen: () => void;
    children: ReactElement;
}) => {
    return (
        <>
            <HeaderExpandButton isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
            <Collapsible id={styles.mainNavSmall} isOpen={isOpen}>
                <nav className={styles.mainNav}>
                    <HeaderLinks
                        currentPath={currentPath}
                        items={items}
                        allPaths={allPaths}
                        apiPaths={apiPaths}
                        isOpen={isOpen}
                        toggleIsOpen={toggleIsOpen}
                    >
                        {children}
                    </HeaderLinks>
                </nav>
            </Collapsible>
        </>
    );
};

export const HeaderNav = ({
    currentPath,
    items,
    allPaths,
    apiPaths,
}: {
    currentPath: string;
    items: MenuItem[];
    allPaths: MenuItem[];
    apiPaths: string[];
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleIsOpen = () => {
        setIsOpen((currentIsOpen) => {
            return !currentIsOpen;
        });
    };

    return (
        <>
            <HeaderNavLarge currentPath={currentPath} items={items} allPaths={allPaths} apiPaths={apiPaths} />
            <HeaderNavSmall
                currentPath={currentPath}
                items={items}
                allPaths={allPaths}
                apiPaths={apiPaths}
                isOpen={isOpen}
                toggleIsOpen={toggleIsOpen}
            />
        </>
    );
};
