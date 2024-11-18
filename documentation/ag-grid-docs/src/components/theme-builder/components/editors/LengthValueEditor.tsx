import { reinterpretCSSValue, stripFloatingPointErrors } from '@components/theme-builder/model/utils';

import { _theming } from 'ag-grid-community';

import { FormattedInput } from './FormattedInput';
import { type ValueEditorProps } from './ValueEditorProps';

export const LengthValueEditor = ({
    param,
    value,
    onChange,
    icon,
    swipeAdjustmentDivisor = 100,
}: ValueEditorProps<_theming.LengthValue>) => {
    const cssValue = _theming.paramValueToCss(param.property, value) || '';
    const units = getUnit(cssValue);
    return (
        <FormattedInput
            value={cssValue}
            onChange={onChange}
            onClear={() => onChange(null)}
            valueToDisplayString={toDisplayString}
            valueToEditingString={toEditingString}
            validateEditingString={(editingString) => {
                const parsed = parseFloat(editingString);
                return isNaN(parsed) ? null : `${parsed}${units}`;
            }}
            icon={icon}
            getIconSwipeAdjustment={(value, pixels) => {
                const proportion = parseFloat(value);
                if (isNaN(proportion)) return value;

                const rawAdjustment = parseFloat(Math.max(proportion + pixels / swipeAdjustmentDivisor, 0).toFixed(1));
                return stripFloatingPointErrors(rawAdjustment) + units;
            }}
        />
    );
};

const toDisplayString = (value: string) => {
    value = value.trim();
    const reinterpreted = reinterpretCSSValue(value, 'length') || value;
    const unit = getUnit(reinterpreted);
    const parsed = parseFloat(reinterpreted);
    return isNaN(parsed) ? value : round2dp(parsed) + unit;
};

const toEditingString = (value: string): string => {
    value = value.trim();
    const reinterpreted = reinterpretCSSValue(value, 'length') || value;
    const number = parseFloat(reinterpreted);
    return isNaN(number) ? value : round2dp(number);
};

const cssFunctionRegex = /\w+\(/i;

const getUnit = (value: string) => {
    if (cssFunctionRegex.test(value)) {
        value = reinterpretCSSValue(value, 'length') || value;
    }
    const [unit] = value.match(/[^\d.]+$/) || [];
    return unit || '';
};

const round2dp = (value: number) => stripFloatingPointErrors(Math.round(value * 100) / 100);
