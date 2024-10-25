import type {
    AgPromise,
    BeanCollection,
    IRichCellEditorRendererParams,
    ITooltipCtrl,
    Registry,
    RichSelectParams,
    TooltipFeature,
    UserCompDetails,
    UserComponentFactory,
} from 'ag-grid-community';
import {
    Component,
    _bindCellRendererToHtmlElement,
    _escapeString,
    _exists,
    _getDocument,
    _getEditorRendererDetails,
    _setAriaSelected,
    _shouldDisplayTooltip,
} from 'ag-grid-community';

import type { AgRichSelect } from './agRichSelect';

export class RichSelectRow<TValue> extends Component {
    private userCompFactory: UserComponentFactory;
    private registry: Registry;

    public wireBeans(beans: BeanCollection) {
        this.userCompFactory = beans.userCompFactory;
        this.registry = beans.registry;
    }

    private value: TValue;
    private parsedValue: string | null;
    private tooltipFeature?: TooltipFeature;
    private shouldDisplayTooltip?: () => boolean;

    constructor(private readonly params: RichSelectParams<TValue>) {
        super(/* html */ `<div class="ag-rich-select-row" role="presentation"></div>`);
    }

    public postConstruct(): void {
        this.tooltipFeature = this.createOptionalManagedBean(
            this.registry.createDynamicBean<TooltipFeature>('tooltipFeature', {
                getGui: () => this.getGui(),
                shouldDisplayTooltip: () => this.shouldDisplayTooltip?.() ?? true,
            } as ITooltipCtrl)
        );
    }

    public setState(value: TValue): void {
        let formattedValue: string = '';

        const { params } = this;

        if (params.valueFormatter) {
            formattedValue = params.valueFormatter(value);
        }
        const rendererSuccessful = this.populateWithRenderer(value, formattedValue);
        if (!rendererSuccessful) {
            this.populateWithoutRenderer(value, formattedValue);
        }

        this.value = value;
    }

    public highlightString(matchString: string): void {
        const { parsedValue } = this;

        if (this.params.cellRenderer || !_exists(parsedValue)) {
            return;
        }

        let hasMatch = _exists(matchString);

        if (hasMatch) {
            const index = parsedValue?.toLocaleLowerCase().indexOf(matchString.toLocaleLowerCase());
            if (index >= 0) {
                const highlightEndIndex = index + matchString.length;
                const startPart = _escapeString(parsedValue.slice(0, index), true);
                const highlightedPart = _escapeString(parsedValue.slice(index, highlightEndIndex), true);
                const endPart = _escapeString(parsedValue.slice(highlightEndIndex));
                this.renderValueWithoutRenderer(
                    /* html */ `${startPart}<span class="ag-rich-select-row-text-highlight">${highlightedPart}</span>${endPart}`
                );
            } else {
                hasMatch = false;
            }
        }

        if (!hasMatch) {
            this.renderValueWithoutRenderer(parsedValue);
        }
    }

    public updateSelected(selected: boolean): void {
        const eGui = this.getGui();
        _setAriaSelected(eGui.parentElement!, selected);

        this.addOrRemoveCssClass('ag-rich-select-row-selected', selected);
    }

    public getValue(): TValue {
        return this.value;
    }

    public toggleHighlighted(highlighted: boolean): void {
        this.addOrRemoveCssClass('ag-rich-select-row-highlighted', highlighted);
    }

    private populateWithoutRenderer(value: any, valueFormatted: any) {
        const eDocument = _getDocument(this.gos);
        const eGui = this.getGui();

        const span = eDocument.createElement('span');
        span.style.overflow = 'hidden';
        span.style.textOverflow = 'ellipsis';
        const parsedValue = _escapeString(_exists(valueFormatted) ? valueFormatted : value, true);
        this.parsedValue = _exists(parsedValue) ? parsedValue : null;

        eGui.appendChild(span);
        this.renderValueWithoutRenderer(parsedValue);
        this.shouldDisplayTooltip = _shouldDisplayTooltip(() => span);
        this.tooltipFeature?.setTooltipAndRefresh(this.parsedValue);
    }

    private renderValueWithoutRenderer(value: string | null): void {
        const span = this.getGui().querySelector('span');
        if (!span) {
            return;
        }
        span.innerHTML = _exists(value) ? value : '&nbsp;';
    }

    private populateWithRenderer(value: TValue, valueFormatted: string): boolean {
        // bad coder here - we are not populating all values of the cellRendererParams
        let cellRendererPromise: AgPromise<any> | undefined;
        let userCompDetails: UserCompDetails | undefined;

        if (this.params.cellRenderer) {
            const richSelect = this.getParentComponent()?.getParentComponent() as AgRichSelect;
            userCompDetails = _getEditorRendererDetails<RichSelectParams, IRichCellEditorRendererParams<TValue>>(
                this.userCompFactory,
                this.params,
                {
                    value,
                    valueFormatted,
                    getValue: () => richSelect?.getValue(),
                    setValue: (value: TValue[] | TValue | null) => {
                        richSelect?.setValue(value, true);
                    },
                    setTooltip: (value: string, shouldDisplayTooltip: () => boolean) => {
                        this.shouldDisplayTooltip = shouldDisplayTooltip;
                        this.tooltipFeature?.setTooltipAndRefresh(value);
                    },
                }
            );
        }

        if (userCompDetails) {
            cellRendererPromise = userCompDetails.newAgStackInstance();
        }

        if (cellRendererPromise) {
            _bindCellRendererToHtmlElement(cellRendererPromise, this.getGui());
        }

        if (cellRendererPromise) {
            cellRendererPromise.then((childComponent) => {
                this.addDestroyFunc(() => {
                    this.destroyBean(childComponent);
                });
            });
            return true;
        }
        return false;
    }
}
