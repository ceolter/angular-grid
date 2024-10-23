import type { AgLabelParams, LabelAlignment } from '../interfaces/agFieldParams';
import { _setAriaRole } from '../utils/aria';
import { _clearElement, _setDisabled, _setDisplayed, _setElementWidth } from '../utils/dom';
import { agAbstractLabelCSS } from './agAbstractLabel.css-GENERATED';
import type { ComponentEvent, ComponentSelector } from './component';
import { Component } from './component';

export type AgAbstractLabelEvent = ComponentEvent;
export abstract class AgAbstractLabel<
    TConfig extends AgLabelParams = AgLabelParams,
    TEventType extends string = AgAbstractLabelEvent,
> extends Component<TEventType | AgAbstractLabelEvent> {
    protected abstract eLabel: HTMLElement;

    protected readonly config: TConfig;
    protected labelSeparator: string = '';
    protected labelAlignment: LabelAlignment = 'left';
    protected disabled: boolean = false;
    private label: HTMLElement | string = '';

    constructor(config?: TConfig, template?: string, components?: ComponentSelector[]) {
        super(template, components);

        this.config = config || ({} as any);
        this.registerCSS(agAbstractLabelCSS);
    }

    public postConstruct() {
        this.addCssClass('ag-labeled');
        this.eLabel.classList.add('ag-label');

        const { labelSeparator, label, labelWidth, labelAlignment, disabled } = this.config;

        if (disabled != null) {
            this.setDisabled(disabled);
        }

        if (labelSeparator != null) {
            this.setLabelSeparator(labelSeparator);
        }

        if (label != null) {
            this.setLabel(label);
        }

        if (labelWidth != null) {
            this.setLabelWidth(labelWidth);
        }

        this.setLabelAlignment(labelAlignment || this.labelAlignment);
        this.refreshLabel();
    }

    protected refreshLabel() {
        _clearElement(this.eLabel);

        if (typeof this.label === 'string') {
            this.eLabel.innerText = this.label + this.labelSeparator;
        } else if (this.label) {
            this.eLabel.appendChild(this.label);
        }

        if (this.label === '') {
            _setDisplayed(this.eLabel, false);
            _setAriaRole(this.eLabel, 'presentation');
        } else {
            _setDisplayed(this.eLabel, true);
            _setAriaRole(this.eLabel, null);
        }
    }

    public setLabelSeparator(labelSeparator: string): this {
        if (this.labelSeparator === labelSeparator) {
            return this;
        }

        this.labelSeparator = labelSeparator;

        if (this.label != null) {
            this.refreshLabel();
        }

        return this;
    }

    public getLabelId(): string {
        this.eLabel.id = this.eLabel.id || `ag-${this.getCompId()}-label`;

        return this.eLabel.id;
    }

    public getLabel(): HTMLElement | string {
        return this.label;
    }

    public setLabel(label: HTMLElement | string): this {
        if (this.label === label) {
            return this;
        }

        this.label = label;

        this.refreshLabel();

        return this;
    }

    public setLabelAlignment(alignment: LabelAlignment): this {
        const eGui = this.getGui();
        const eGuiClassList = eGui.classList;

        eGuiClassList.toggle('ag-label-align-left', alignment === 'left');
        eGuiClassList.toggle('ag-label-align-right', alignment === 'right');
        eGuiClassList.toggle('ag-label-align-top', alignment === 'top');

        return this;
    }

    public setLabelEllipsis(hasEllipsis: boolean): this {
        this.eLabel.classList.toggle('ag-label-ellipsis', hasEllipsis);

        return this;
    }

    public setLabelWidth(width: number | 'flex'): this {
        if (this.label == null) {
            return this;
        }

        _setElementWidth(this.eLabel, width);

        return this;
    }

    public setDisabled(disabled: boolean): this {
        disabled = !!disabled;

        const element = this.getGui();

        _setDisabled(element, disabled);
        element.classList.toggle('ag-disabled', disabled);

        this.disabled = disabled;

        return this;
    }

    public isDisabled(): boolean {
        return !!this.disabled;
    }
}
