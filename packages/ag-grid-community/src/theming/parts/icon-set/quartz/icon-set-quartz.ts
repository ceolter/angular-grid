import type { Part } from '../../../Part';
import { createPart } from '../../../Part';
import { getQuartzIconsCss } from './quartz-icon-data';

export const iconSetQuartz = (args: { strokeWidth?: number } = {}): Part<unknown> => {
    return createPart({
        feature: 'iconSet',
        css: () => getQuartzIconsCss(args),
    });
};

export const iconSetQuartzLight = /*#__PURE__*/ iconSetQuartz({ strokeWidth: 1 });

export const iconSetQuartzRegular = /*#__PURE__*/ iconSetQuartz();

export const iconSetQuartzBold = /*#__PURE__*/ iconSetQuartz({ strokeWidth: 2 });
