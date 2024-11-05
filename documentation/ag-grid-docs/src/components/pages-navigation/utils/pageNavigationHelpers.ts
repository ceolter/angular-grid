import type { MenuItem } from '@ag-grid-types';
import type { Framework, MenuSection } from '@ag-grid-types';
import { getExamplePageUrl } from '@components/docs/utils/urlPaths';

export function toElementId(str: string) {
    return 'menu-' + str.toLowerCase().replace('&', '').replace('/', '').replaceAll(' ', '-');
}

export function getLinkUrl({ framework, path, url }: { framework: Framework; path?: string; url?: string }) {
    return url ? url : getExamplePageUrl({ framework, path: path! });
}

const createGetTopLevelMenuItem = (activeMenuItemPath: string) => {
    const findPath = ({ path, items }: MenuItem) => {
        return path === activeMenuItemPath || items?.some(findPath);
    };
    return findPath;
};

export function findActiveTopLevelMenuItem({
    menuSections,
    activeMenuItemPath,
}: {
    menuSections: MenuSection[];
    activeMenuItemPath: string;
}): MenuItem | undefined {
    return menuSections.reduce((foundMenuItem: MenuItem | undefined, section: MenuSection) => {
        const { items } = section;
        if (!items) {
            return;
        }
        const getTopLevelMenuItem = createGetTopLevelMenuItem(activeMenuItemPath);
        return items.find(getTopLevelMenuItem) || foundMenuItem;
    }, undefined);
}

export function findActiveMenuItem({
    menuSections,
    activeMenuItemPath,
}: {
    menuSections: MenuSection[];
    activeMenuItemPath: string;
}) {
    const getMenuItemReducer = (foundMenuItem: MenuItem | undefined, menuItem: MenuItem): MenuItem | undefined => {
        const { path, items } = menuItem;
        if (path === activeMenuItemPath) {
            return menuItem;
        }
        const childMenuItem = items?.reduce(getMenuItemReducer, undefined);

        return childMenuItem ? childMenuItem : foundMenuItem;
    };
    const getMenuSectionReducer = (
        foundMenuItem: MenuItem | undefined,
        menuSection: MenuSection
    ): MenuItem | undefined => {
        const { items } = menuSection;
        const childMenuItem = items?.reduce(getMenuItemReducer, undefined);

        return childMenuItem ? childMenuItem : foundMenuItem;
    };

    return menuSections.reduce<MenuItem | undefined>(getMenuSectionReducer, undefined);
}
