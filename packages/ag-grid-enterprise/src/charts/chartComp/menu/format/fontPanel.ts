import type { AgSelectParams, BeanCollection } from 'ag-grid-community';
import { AgSelectSelector, Component, RefPlaceholder, _removeFromParent } from 'ag-grid-community';

import type { AgGroupComponent, AgGroupComponentParams } from '../../../../widgets/agGroupComponent';
import { AgGroupComponentSelector } from '../../../../widgets/agGroupComponent';
import { AgColorPickerSelector } from '../../../widgets/agColorPicker';
import type { ChartOptionsProxy } from '../../services/chartOptionsService';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../chartMenuParamsFactory';

interface Font {
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    fontSize?: number;
    color?: string;
}

export interface FontPanelParams {
    name?: string;
    enabled: boolean;
    suppressEnabledCheckbox?: boolean;
    onEnableChange?: (enabled: boolean) => void;
    chartMenuParamsFactory: ChartMenuParamsFactory;
    keyMapper: (key: string) => string;
    cssIdentifier?: string;
}

function _capitalise(str: string): string {
    return str[0].toUpperCase() + str.substring(1).toLowerCase();
}

export class FontPanel extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private readonly fontGroup: AgGroupComponent = RefPlaceholder;

    private readonly chartOptions: ChartOptionsProxy;
    private activeComps: Component[] = [];

    constructor(private readonly params: FontPanelParams) {
        super();
        this.chartOptions = params.chartMenuParamsFactory.getChartOptions();
    }

    public postConstruct() {
        const {
            cssIdentifier = 'charts-format-sub-level',
            name: title,
            enabled,
            onEnableChange,
            suppressEnabledCheckbox,
            chartMenuParamsFactory,
            keyMapper,
        } = this.params;
        const fontGroupParams: AgGroupComponentParams = {
            cssIdentifier,
            direction: 'vertical',
            suppressOpenCloseIcons: true,
            title,
            enabled,
            suppressEnabledCheckbox: true,
            onEnableChange: (enabled) => {
                if (onEnableChange) {
                    onEnableChange(enabled);
                }
            },
            useToggle: !suppressEnabledCheckbox,
        };
        this.setTemplate(
            /* html */ `<div class="ag-font-panel">
        <ag-group-component data-ref="fontGroup">
            <ag-select data-ref="familySelect"></ag-select>
            <ag-select data-ref="weightStyleSelect"></ag-select>
            <div class="ag-charts-font-size-color">
                <ag-select data-ref="sizeSelect"></ag-select>
                <ag-color-picker data-ref="colorPicker"></ag-color-picker>
            </div>
        </ag-group-component>
    </div>`,
            [AgGroupComponentSelector, AgSelectSelector, AgColorPickerSelector],
            {
                fontGroup: fontGroupParams,
                familySelect: this.getFamilySelectParams(),
                weightStyleSelect: this.getWeightStyleSelectParams(),
                sizeSelect: this.getSizeSelectParams(),
                colorPicker: chartMenuParamsFactory.getDefaultColorPickerParams(keyMapper('color')),
            }
        );
        this.addOrRemoveCssClass('ag-font-panel-no-header', !title);
    }

    public addItem(comp: Component<any>, prepend?: boolean) {
        if (prepend) {
            this.fontGroup.prependItem(comp);
        } else {
            this.fontGroup.addItem(comp);
        }
        this.activeComps.push(comp);
    }

    public setEnabled(enabled: boolean): void {
        this.fontGroup.setEnabled(enabled);
    }

    private getFamilySelectParams(): AgSelectParams {
        const families = [
            'Arial, sans-serif',
            'Aria Black, sans-serif',
            'Book Antiqua,  serif',
            'Charcoal, sans-serif',
            'Comic Sans MS, cursive',
            'Courier, monospace',
            'Courier New, monospace',
            'Gadget, sans-serif',
            'Geneva, sans-serif',
            'Helvetica, sans-serif',
            'Impact, sans-serif',
            'Lucida Console, monospace',
            'Lucida Grande, sans-serif',
            'Lucida Sans Unicode,  sans-serif',
            'Monaco, monospace',
            'Palatino Linotype, serif',
            'Palatino, serif',
            'Times New Roman, serif',
            'Times, serif',
            'Verdana, sans-serif',
        ];

        const family = this.getInitialFontValue('fontFamily');
        let initialValue = families[0];

        if (family) {
            // check for known values using lowercase
            const lowerCaseValues = families.map((f) => f.toLowerCase());
            const valueIndex = lowerCaseValues.indexOf(family.toLowerCase());

            if (valueIndex >= 0) {
                initialValue = families[valueIndex];
            } else {
                // add user provided value to list
                const capitalisedFontValue = _capitalise(family);

                families.push(capitalisedFontValue);

                initialValue = capitalisedFontValue;
            }
        }

        const options = families.sort().map((value) => ({ value, text: value }));

        return this.params.chartMenuParamsFactory.getDefaultSelectParamsWithoutValueParams(
            'font',
            options,
            `${initialValue}`,
            (newValue) => this.setFont({ fontFamily: newValue! })
        );
    }

    private getSizeSelectParams(): AgSelectParams {
        const sizes = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
        const size = this.getInitialFontValue('fontSize');

        if (!sizes.includes(size!)) {
            sizes.push(size!);
        }

        const options = sizes.sort((a, b) => a - b).map((value) => ({ value: `${value}`, text: `${value}` }));

        return this.params.chartMenuParamsFactory.getDefaultSelectParamsWithoutValueParams(
            'size',
            options,
            `${size}`,
            (newValue) => this.setFont({ fontSize: parseInt(newValue!, 10) })
        );
    }

    private getWeightStyleSelectParams(): AgSelectParams {
        const weight = this.getInitialFontValue('fontWeight') ?? 'normal';
        const style = this.getInitialFontValue('fontStyle') ?? 'normal';

        const weightStyles: {
            name: 'normal' | 'bold' | 'italic' | 'boldItalic' | 'predefined';
            weight: string;
            style: string;
        }[] = [
            { name: 'normal', weight: 'normal', style: 'normal' },
            { name: 'bold', weight: 'bold', style: 'normal' },
            { name: 'italic', weight: 'normal', style: 'italic' },
            { name: 'boldItalic', weight: 'bold', style: 'italic' },
        ];

        let selectedOption = weightStyles.find((x) => x.weight === weight && x.style === style);

        if (!selectedOption) {
            selectedOption = { name: 'predefined', weight, style };
            weightStyles.unshift(selectedOption);
        }

        const options = weightStyles.map((ws) => ({
            value: ws.name,
            text: this.chartTranslation.translate(ws.name),
        }));

        return this.params.chartMenuParamsFactory.getDefaultSelectParamsWithoutValueParams(
            'weight',
            options,
            selectedOption.name,
            (newValue) => {
                const selectedWeightStyle = weightStyles.find((x) => x.name === newValue);

                this.setFont({ fontWeight: selectedWeightStyle!.weight, fontStyle: selectedWeightStyle!.style });
            }
        );
    }

    private destroyActiveComps(): void {
        this.activeComps.forEach((comp) => {
            _removeFromParent(comp.getGui());
            this.destroyBean(comp);
        });
    }

    public override destroy(): void {
        this.destroyActiveComps();
        super.destroy();
    }

    private setFont(font: Font): void {
        const { keyMapper } = this.params;
        Object.entries(font).forEach(([fontKey, value]: [keyof Font, any]) => {
            if (value) {
                this.chartOptions.setValue(keyMapper(fontKey), value);
            }
        });
    }

    private getInitialFontValue<K extends keyof Font>(fontKey: K): Font[K] {
        const { keyMapper } = this.params;
        return this.chartOptions.getValue(keyMapper(fontKey));
    }
}
