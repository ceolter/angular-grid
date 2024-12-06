import { ICON_MAP } from '@ag-website-shared/components/icon/Icon';
import { FRAMEWORKS } from '@constants';
import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        enterprise: z.boolean().optional(),
        frameworks: z.array(z.enum(FRAMEWORKS as any)).optional(),
        /**
         * Hide right hand side menu
         */
        hideSideMenu: z.boolean().optional(),
        /**
         * Hide left hand page menu
         */
        hidePageMenu: z.boolean().optional(),
        /**
         * Override side navigation headings
         */
        headings: z
            .array(
                z.object({
                    depth: z.number(),
                    slug: z.string(),
                    text: z.string(),
                })
            )
            .optional(),
    }),
});

const menuItemBase = {
    title: z.string(),
    description: z.string().optional(),
    /**
     * Path to website docs within `src/content/docs`
     */
    path: z.string().optional(),
    /**
     * External link url
     */
    url: z.string().url().optional(),
    /**
     * Open external link url in a new window
     */
    newWindow: z.boolean().optional(),
    icon: z.enum(Object.keys(ICON_MAP) as any).optional(),
    frameworks: z.array(z.enum(FRAMEWORKS as any)).optional(),

    isEnterprise: z.boolean().optional(),
};

const level3MenuItem = z.object({
    ...menuItemBase,
    items: z.array(z.object(menuItemBase)).optional(),
});

const level2MenuItem = z.object({
    ...menuItemBase,
    items: z.array(level3MenuItem).optional(),
});

const level1MenuItem = z.object({
    ...menuItemBase,
    items: z.array(level2MenuItem).optional(),
});

const sectionItem = z.object({
    title: z.string().optional(),
    excludeFromFeatures: z.boolean().optional(),
    items: z.array(level1MenuItem).optional(),

    // What's new parameters
    type: z.enum(['whats-new']).optional(),
    path: z.string().optional(),
});

const menu = defineCollection({
    type: 'data',
    schema: z.object({
        api: z.object({
            sections: z.array(sectionItem),
        }),
        main: z.object({
            sections: z.array(sectionItem),
        }),
    }),
});

const matrixTable = defineCollection({
    type: 'data',
    schema: z.array(z.record(z.string(), z.any())),
});

const moduleItemBase = {
    moduleName: z.string(),
    name: z.string(),
    path: z.string().optional(),
    isEnterprise: z.boolean().optional(),
    ssrmBundled: z.boolean().optional(),
};

const moduleGroupLevel2 = z.object({
    name: z.string(),
    children: z.array(z.object(moduleItemBase)).optional(),
    isEnterprise: z.boolean().optional(),
});

const moduleGroupLevel1 = z.object({
    name: z.string(),
    children: z.array(z.object(moduleItemBase).or(moduleGroupLevel2)).optional(),
    isEnterprise: z.boolean().optional(),
});

const moduleMappings = defineCollection({
    type: 'data',
    schema: z.object({
        groups: z.array(z.object(moduleItemBase).or(moduleGroupLevel1)),
    }),
});

const errors = defineCollection({
    schema: z.object({
        description: z.string().optional(),
    }),
});

export const collections = {
    docs,
    menu,
    'matrix-table': matrixTable,
    'module-mappings': moduleMappings,
    errors,
};
