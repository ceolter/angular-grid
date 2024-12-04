import { createPart } from '../../../Part';
import { sharedIconStylesCSS } from '../shared-icon-styles.css-GENERATED';
import { iconSetMaterialCSS } from './icon-set-material.css-GENERATED';

export const iconSetMaterial = /*#__PURE__*/ createPart({
    feature: 'iconSet',
    css: () => sharedIconStylesCSS + iconSetMaterialCSS,
});
