import { createPart } from '../../../Part';
import { sharedIconStylesCSS } from '../shared-icon-styles.css-GENERATED';
import { iconSetAlpineCSS } from './icon-set-alpine.css-GENERATED';

export const iconSetAlpine = /*#__PURE__*/ createPart({
    feature: 'iconSet',
    css: () => sharedIconStylesCSS + iconSetAlpineCSS,
});
