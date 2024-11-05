import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Collapsible } from '@components/Collapsible';
import { getExamplePageUrl } from '@components/docs/utils/urlPaths';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { Fragment, useEffect, useState } from 'react';

import styles from './DocsNav.module.scss';

function getOpenGroup({ menuData, pageName }: { menuData?: any; pageName: string }) {
    let openGroup = undefined;

    function childrenHasPage({ group, children, pageName }) {
        children.forEach((child) => {
            if (child.path === pageName) {
                openGroup = group;
                return;
            }

            if (child.children) childrenHasPage({ group, children: child.children, pageName });
        });
    }

    menuData.sections.forEach((section) => {
        section.children.forEach((child) => {
            if (child.type !== 'group' || !child.children) return;

            childrenHasPage({ group: child, children: child.children, pageName });
        });
    });

    return openGroup;
}

function getLinkUrl({ framework, path, url }: { framework: Framework; path?: string; url?: string }) {
    return url ? url : getExamplePageUrl({ framework, path: path! });
}

function Item({ itemData, framework, pageName }: { itemData?: any; framework: Framework; pageName: string }) {
    const linkUrl = itemData.path ? getLinkUrl({ framework, path: itemData.path }) : itemData.url;
    const isExternalURL = itemData.url;
    const isCorrectFramework = !itemData.frameworks
        ? true
        : itemData.frameworks.filter((f) => {
              return f === framework;
          }).length > 0;
    const isActive = pageName === itemData.path;

    const className = classnames(styles.item, itemData.icon ? styles.hasIcon : '', isActive ? styles.isActive : '');

    return (
        isCorrectFramework && (
            <>
                <a href={linkUrl} className={className} {...(isExternalURL && { target: '_blank' })}>
                    {itemData.icon && <Icon name={itemData.icon} svgClasses={styles.itemIcon} />}

                    <span>
                        {itemData.title}
                        {itemData.isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
                        {isExternalURL && <Icon name="newTab" svgClasses={styles.externalIcon} />}
                    </span>
                </a>

                {itemData.children && (
                    <div className={styles.nestedItems}>
                        {itemData.children.map((childData) => {
                            return (
                                <Item
                                    key={childData.title}
                                    itemData={childData}
                                    framework={framework}
                                    pageName={pageName}
                                />
                            );
                        })}
                    </div>
                )}
            </>
        )
    );
}

function Group({
    groupData,
    framework,
    pageName,
    openGroup,
    setOpenGroup,
}: {
    groupData?: any;
    framework: Framework;
    pageName: string;
    openGroup?: any;
    setOpenGroup?: any;
}) {
    const isOpen = openGroup === groupData;

    return (
        <div className={classnames(styles.group, isOpen ? styles.isOpen : '')}>
            <button
                className={classnames('button-style-none', styles.groupTitle)}
                onClick={() => {
                    if (isOpen) {
                        setOpenGroup(undefined);
                    } else {
                        setOpenGroup(groupData);
                    }
                }}
            >
                <Icon name="chevronRight" svgClasses={styles.groupChevron} />

                <span>{groupData.title}</span>
            </button>

            <Collapsible id={groupData.title} isOpen={isOpen}>
                <div className={styles.groupChildren}>
                    {groupData.children.map((childData) => {
                        return (
                            <Item
                                key={childData.title}
                                itemData={childData}
                                framework={framework}
                                pageName={pageName}
                            />
                        );
                    })}
                </div>
            </Collapsible>
        </div>
    );
}

function Section({
    sectionData,
    framework,
    pageName,
    openGroup,
    setOpenGroup,
}: {
    sectionData?: any;
    framework: Framework;
    pageName: string;
    openGroup?: any;
    setOpenGroup?: any;
}) {
    return (
        <div className={styles.section}>
            {sectionData.hideTitle ?? <h5 className={styles.sectionTitle}>{sectionData.title}</h5>}

            {sectionData.children.map((childData) => {
                return (
                    <Fragment key={childData.title}>
                        {childData.type === 'item' && (
                            <Item itemData={childData} framework={framework} pageName={pageName} />
                        )}
                        {childData.type === 'group' && (
                            <Group
                                groupData={childData}
                                framework={framework}
                                pageName={pageName}
                                openGroup={openGroup}
                                setOpenGroup={setOpenGroup}
                            />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
}

export function DocsNav({
    menuData,
    framework,
    pageName,
    showWhatsNew = true,
}: {
    menuData?: any;
    framework: Framework;
    pageName: string;
    showWhatsNew?: boolean;
}) {
    const pageOpenGroup = getOpenGroup({ menuData, pageName });

    const [openGroup, setOpenGroup] = useState(pageOpenGroup);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const docsButtonEl = document.querySelector('#top-bar-docs-button');

        const docsButtonHandler = () => {
            setMobileNavOpen(!mobileNavOpen);
        };

        docsButtonEl?.addEventListener('click', docsButtonHandler);

        return () => {
            docsButtonEl?.removeEventListener('click', docsButtonHandler);
        };
    }, [mobileNavOpen]);

    return (
        <Collapsible id="docs-mobile-nav-collapser" isOpen={mobileNavOpen}>
            <div id="docs-nav-scroll" className={styles.docsNavOuter}>
                <div className={styles.docsNavInner}>
                    {showWhatsNew && (
                        <div className={styles.whatsNewLink}>
                            <a href={urlWithBaseUrl('/whats-new')}>What's New</a>
                        </div>
                    )}

                    {menuData.sections.map((sectionData, i) => {
                        return (
                            <Fragment key={`${sectionData.title}-${i}`}>
                                <Section
                                    sectionData={sectionData}
                                    framework={framework}
                                    pageName={pageName}
                                    openGroup={openGroup}
                                    setOpenGroup={setOpenGroup}
                                />
                                {i !== menuData.sections.length - 1 && <hr className={styles.divider} />}
                            </Fragment>
                        );
                    })}
                </div>
            </div>
        </Collapsible>
    );
}
