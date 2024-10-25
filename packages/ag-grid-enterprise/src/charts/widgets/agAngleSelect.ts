import type {
    AgInputNumberField,
    AgLabelParams,
    BeanCollection,
    DragListenerParams,
    DragService,
} from 'ag-grid-community';
import {
    AgAbstractLabel,
    AgInputNumberFieldSelector,
    RefPlaceholder,
    _exists,
    _getActiveDomElement,
    _setFixedWidth,
} from 'ag-grid-community';

export interface AgAngleSelectParams extends AgLabelParams {
    value?: number;
    onValueChange?: (value: number) => void;
}

export type AgAngleSelectEvent = 'fieldValueChanged';
export class AgAngleSelect extends AgAbstractLabel<AgAngleSelectParams, AgAngleSelectEvent> {
    protected dragSvc?: DragService;

    public wireBeans(beans: BeanCollection) {
        this.dragSvc = beans.dragSvc;
    }

    protected readonly eLabel: HTMLElement = RefPlaceholder;
    private readonly eParentCircle: HTMLElement = RefPlaceholder;
    private readonly eChildCircle: HTMLElement = RefPlaceholder;
    private readonly eAngleValue: AgInputNumberField = RefPlaceholder;

    private parentCircleRect: ClientRect | DOMRect;
    private degrees: number;
    private radius: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private dragListener: DragListenerParams;

    constructor(config?: AgAngleSelectParams) {
        super(
            config,
            /* html */ `<div class="ag-angle-select">
            <div data-ref="eLabel"></div>
            <div class="ag-wrapper ag-angle-select-wrapper">
                <div class="ag-angle-select-field">
                    <div data-ref="eParentCircle" class="ag-angle-select-parent-circle">
                        <div data-ref="eChildCircle" class="ag-angle-select-child-circle"></div>
                    </div>
                </div>
                <ag-input-number-field data-ref="eAngleValue"></ag-input-number-field>
            </div>
        </div>`,
            [AgInputNumberFieldSelector]
        );
    }

    public override postConstruct() {
        super.postConstruct();

        const { value, onValueChange } = this.config;

        if (value != null) {
            this.setValue(value, undefined, true);
        }
        if (onValueChange != null) {
            this.onValueChange(onValueChange);
        }

        this.dragListener = {
            eElement: this.eParentCircle,
            dragStartPixels: 0,
            onDragStart: () => {
                this.parentCircleRect = this.eParentCircle.getBoundingClientRect();
            },
            onDragging: (e: MouseEvent | Touch) => this.calculateAngleDrag(e),
            onDragStop: () => {},
        };

        this.dragSvc?.addDragSource(this.dragListener);

        this.eAngleValue
            .setLabel('')
            .setLabelWidth(5)
            .setInputWidth(45)
            .setMin(0)
            .setMax(360)
            .setValue(`${this.degrees}`)
            .onValueChange((value: string) => {
                if (value == null || value === '') {
                    value = '0';
                }
                value = this.eAngleValue.normalizeValue(value);
                let floatValue = parseFloat(value);
                if (floatValue > 180) {
                    floatValue = floatValue - 360;
                }
                this.setValue(floatValue);
            });

        this.updateNumberInput();

        if (_exists(this.getValue())) {
            this.eAngleValue.setValue(this.normalizeNegativeValue(this.getValue()).toString());
        }

        this.addManagedListeners(this, {
            fieldValueChanged: () => {
                if (this.eAngleValue.getInputElement().contains(_getActiveDomElement(this.gos))) {
                    return;
                }
                this.updateNumberInput();
            },
        });
    }

    private updateNumberInput(): void {
        const normalizedValue = this.normalizeNegativeValue(this.getValue());
        this.eAngleValue.setValue(normalizedValue.toString());
    }

    private positionChildCircle(radians: number) {
        const rect = this.parentCircleRect || { width: 24, height: 24 };
        const eChildCircle = this.eChildCircle;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        eChildCircle.style.left = `${centerX + Math.cos(radians) * 8}px`;
        eChildCircle.style.top = `${centerY + Math.sin(radians) * 8}px`;
    }

    private calculatePolar() {
        const x = this.offsetX;
        const y = this.offsetY;

        const radians = Math.atan2(y, x);
        this.degrees = this.toDegrees(radians);
        this.radius = Math.sqrt(x * x + y * y);

        this.positionChildCircle(radians);
    }

    private calculateCartesian() {
        const radians = this.toRadians(this.getValue());
        const radius = this.getRadius();

        this.setOffsetX(Math.cos(radians) * radius).setOffsetY(Math.sin(radians) * radius);
    }

    private setOffsetX(offset: number): this {
        if (this.offsetX !== offset) {
            this.offsetX = offset;
            this.calculatePolar();
        }

        return this;
    }

    private setOffsetY(offset: number): this {
        if (this.offsetY !== offset) {
            this.offsetY = offset;
            this.calculatePolar();
        }
        return this;
    }

    private calculateAngleDrag(e: MouseEvent | Touch) {
        const rect = this.parentCircleRect;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - centerX;
        const dy = y - centerY;

        const radians = Math.atan2(dy, dx);

        this.setValue(radians, true);
    }

    private toDegrees(radians: number): number {
        return (radians / Math.PI) * 180;
    }

    private toRadians(degrees: number): number {
        return (degrees / 180) * Math.PI;
    }

    private normalizeNegativeValue(degrees: number): number {
        return degrees < 0 ? 360 + degrees : degrees;
    }

    private normalizeAngle180(radians: number): number {
        radians %= Math.PI * 2;

        if (radians < -Math.PI) {
            radians += Math.PI * 2;
        } else if (radians >= Math.PI) {
            radians -= Math.PI * 2;
        }

        return radians;
    }

    public getRadius(): number {
        return this.radius;
    }

    public setRadius(r: number): this {
        if (this.radius === r) {
            return this;
        }
        this.radius = r;
        this.calculateCartesian();

        return this;
    }

    public onValueChange(callbackFn: (newValue: number) => void): this {
        this.addManagedListeners(this, {
            fieldValueChanged: () => {
                callbackFn(this.degrees);
            },
        });
        return this;
    }

    public getValue(radians?: boolean): number {
        return radians ? this.toRadians(this.degrees) : this.degrees;
    }

    public setValue(degrees: number, radians?: boolean, silent?: boolean): this {
        let radiansValue: number;
        if (!radians) {
            radiansValue = this.normalizeAngle180(this.toRadians(degrees));
        } else {
            radiansValue = degrees;
        }

        degrees = this.toDegrees(radiansValue);

        if (this.degrees !== degrees) {
            this.degrees = Math.floor(degrees);
            this.calculateCartesian();
            this.positionChildCircle(radiansValue);
            if (!silent) {
                this.dispatchLocalEvent({ type: 'fieldValueChanged' });
            }
        }

        return this;
    }

    public setWidth(width: number): this {
        _setFixedWidth(this.getGui(), width);
        return this;
    }

    public override setDisabled(disabled: boolean): this {
        super.setDisabled(disabled);

        this.eAngleValue.setDisabled(disabled);

        return this;
    }

    public override destroy(): void {
        this.dragSvc?.removeDragSource(this.dragListener);
        super.destroy();
    }
}
