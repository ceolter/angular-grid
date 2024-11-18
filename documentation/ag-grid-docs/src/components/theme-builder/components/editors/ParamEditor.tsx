import { useSetAdvancedParamEnabled } from '@components/theme-builder/model/advanced-params';
import type { ThemeParam } from '@components/theme-builder/model/utils';
import type { FC, ReactNode } from 'react';

import type { _theming } from 'ag-grid-community';

import { ParamModel, useParamAtom } from '../../model/ParamModel';
import { useRenderedTheme } from '../../model/rendered-theme';
import { getThemeDefaultParams } from '../component-utils';
import { withErrorBoundary } from '../general/ErrorBoundary';
import { BorderStyleValueEditor } from './BorderStyleValueEditor';
import { BorderValueEditor } from './BorderValueEditor';
import { ColorSchemeValueEditor } from './ColorSchemeValueEditor';
import { ColorValueEditor } from './ColorValueEditor';
import { CssValueEditor } from './CssValueEditor';
import { FontFamilyValueEditor } from './FontFamilyValueEditor';
import { FontWeightValueEditor } from './FontWeightValueEditor';
import { FormField } from './FormField';
import { LengthValueEditor } from './LengthValueEditor';
import { ScaleValueEditor } from './ScaleValueEditor';
import type { ValueEditorProps } from './ValueEditorProps';

export type ParamEditorProps = {
    param: ThemeParam | ParamModel<unknown>;
    label?: string;
    showDocs?: boolean;
    icon?: ReactNode;
    swipeAdjustmentDivisor?: number;
    isAdvancedSection?: boolean;
};

export const ParamEditor = withErrorBoundary((props: ParamEditorProps) => {
    const param = ParamModel.for(props.param);
    const [value, setValue] = useParamAtom(param);
    const setAdvancedParamEnabled = useSetAdvancedParamEnabled();

    if (!props.isAdvancedSection && param.onlyEditableAsAdvancedParam) {
        throw new Error(`Add ${param.property} to nonAdvancedParams to allow editing outside the advanced section.`);
    }

    const theme = useRenderedTheme();
    let editorValue = value;
    if (editorValue == null) {
        const params = getThemeDefaultParams(theme);
        if (param.property in params) {
            editorValue = params[param.property];
        } else {
            throw new Error(`ThemeParam "${param.property}" does not exist.`);
        }
    }

    const ValueEditorComponent = valueEditors[param.type] || CssValueEditor;

    return (
        <FormField
            label={props.label || param.label}
            docs={props.showDocs ? param.docs : null}
            onCloseClick={
                props.isAdvancedSection
                    ? () => {
                          setAdvancedParamEnabled(param, false);
                          if (param.onlyEditableAsAdvancedParam) {
                              setValue(undefined);
                          }
                      }
                    : undefined
            }
        >
            <ValueEditorComponent
                param={param}
                value={editorValue}
                onChange={setValue}
                icon={props.icon}
                swipeAdjustmentDivisor={props.swipeAdjustmentDivisor}
            />
        </FormField>
    );
});

const valueEditors: Record<_theming.ParamType, FC<ValueEditorProps<any>>> = {
    color: ColorValueEditor,
    colorScheme: ColorSchemeValueEditor,
    length: LengthValueEditor,
    scale: ScaleValueEditor,
    border: BorderValueEditor,
    borderStyle: BorderStyleValueEditor,
    shadow: CssValueEditor,
    image: CssValueEditor,
    fontFamily: FontFamilyValueEditor,
    fontWeight: FontWeightValueEditor,
    duration: LengthValueEditor,
};
