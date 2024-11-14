import type { IColor, _IUtil } from 'ag-charts-types';

import type { BeanCollection } from 'ag-grid-community';
import { Component, KeyCode, RefPlaceholder, _exists, _setDisplayed } from 'ag-grid-community';

import type { AgChartsExports } from '../agChartsExports';
import type { AgColorInput } from './agColorInput';
import { AgColorInputSelector } from './agColorInput';
import type { AgColorPicker } from './agColorPicker';

const maxRecentColors = 8;

let sharedRecentColors: string[] = [];

export class AgColorPanel extends Component {
    private H = 1; // in the [0, 1] range
    private S = 1; // in the [0, 1] range
    private B = 1; // in the [0, 1] range
    private A = 1; // in the [0, 1] range

    private spectrumValRect?: ClientRect | DOMRect;
    private isSpectrumDragging = false;

    private spectrumHueRect?: ClientRect | DOMRect;
    private isSpectrumHueDragging = false;

    private spectrumAlphaRect?: ClientRect | DOMRect;
    private isSpectrumAlphaDragging = false;

    private picker: Component;
    private _Color: _IUtil['Color'];

    private colorChanged = false;
    private tabIndex: string;

    private readonly spectrumColor: HTMLElement = RefPlaceholder;
    private readonly spectrumVal: HTMLElement = RefPlaceholder;
    private readonly spectrumDragger: HTMLElement = RefPlaceholder;
    private readonly spectrumHue: HTMLElement = RefPlaceholder;
    private readonly spectrumHueSlider: HTMLElement = RefPlaceholder;
    private readonly spectrumAlpha: HTMLElement = RefPlaceholder;
    private readonly spectrumAlphaSlider: HTMLElement = RefPlaceholder;
    private readonly colorInput: AgColorInput = RefPlaceholder;
    private readonly recentColors: HTMLElement = RefPlaceholder;

    constructor(config: { picker: Component<any> }) {
        super(
            /* html */ `<div class="ag-color-panel" tabindex="-1">
            <div data-ref="spectrumColor" class="ag-spectrum-color">
                <div class="ag-spectrum-sat ag-spectrum-fill">
                    <div data-ref="spectrumVal" class="ag-spectrum-val ag-spectrum-fill">
                        <div data-ref="spectrumDragger" class="ag-spectrum-dragger"></div>
                    </div>
                </div>
            </div>
            <div class="ag-spectrum-tools">
                <div data-ref="spectrumHue" class="ag-spectrum-hue ag-spectrum-tool">
                    <div class="ag-spectrum-hue-background"></div>
                    <div data-ref="spectrumHueSlider" class="ag-spectrum-slider"></div>
                </div>
                <div data-ref="spectrumAlpha" class="ag-spectrum-alpha ag-spectrum-tool">
                    <div class="ag-spectrum-alpha-background"></div>
                    <div data-ref="spectrumAlphaSlider" class="ag-spectrum-slider"></div>
                </div>
                <ag-color-input data-ref="colorInput"></ag-color-input>
                <div data-ref="recentColors" class="ag-recent-colors"></div>
            </div>
        </div>`,
            [AgColorInputSelector]
        );
        this.picker = config.picker;
    }

    public wireBeans(beans: BeanCollection): void {
        this._Color = (beans.agChartsExports as AgChartsExports)._Util.Color;
    }

    public postConstruct() {
        this.initTabIndex();
        this.initRecentColors();

        this.addGuiEventListener('focus', () => this.spectrumColor.focus());
        this.addGuiEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === KeyCode.ENTER && !e.defaultPrevented) {
                this.destroy();
            }
        });

        this.addManagedListeners(this.spectrumColor, { keydown: (e) => this.moveDragger(e) });
        this.addManagedListeners(this.spectrumAlphaSlider, { keydown: (e) => this.moveAlphaSlider(e) });
        this.addManagedListeners(this.spectrumHueSlider, { keydown: (e) => this.moveHueSlider(e) });

        this.addManagedListeners(this.spectrumVal, { mousedown: this.onSpectrumDraggerDown.bind(this) });
        this.addManagedListeners(this.spectrumHue, { mousedown: this.onSpectrumHueDown.bind(this) });
        this.addManagedListeners(this.spectrumAlpha, { mousedown: this.onSpectrumAlphaDown.bind(this) });

        this.addGuiEventListener('mousemove', (e: MouseEvent) => {
            this.onSpectrumDraggerMove(e);
            this.onSpectrumHueMove(e);
            this.onSpectrumAlphaMove(e);
        });

        // Listening to `mouseup` on the document on purpose. The user might release the mouse button
        // outside the UI control. When the mouse returns back to the control's area, the dragging
        // of the thumb is not expected and seen as a bug.
        this.addManagedListeners(document, { mouseup: this.onMouseUp.bind(this) });

        this.colorInput.onColorChanged(this.setColor.bind(this));

        this.addManagedListeners(this.recentColors, {
            click: this.onRecentColorClick.bind(this),
            keydown: (e: KeyboardEvent) => {
                if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
                    e.preventDefault();
                    this.onRecentColorClick(e);
                }
            },
        });
    }

    private initTabIndex(): void {
        const tabIndex = (this.tabIndex = this.gos.get('tabIndex').toString());

        this.spectrumColor.setAttribute('tabindex', tabIndex);
        this.spectrumHueSlider.setAttribute('tabindex', tabIndex);
        this.spectrumAlphaSlider.setAttribute('tabindex', tabIndex);
    }

    private refreshSpectrumRect() {
        return (this.spectrumValRect = this.spectrumVal.getBoundingClientRect());
    }

    private refreshHueRect() {
        return (this.spectrumHueRect = this.spectrumHue.getBoundingClientRect());
    }

    private refreshAlphaRect() {
        return (this.spectrumAlphaRect = this.spectrumAlpha.getBoundingClientRect());
    }

    private onSpectrumDraggerDown(e: MouseEvent) {
        e.preventDefault();
        this.refreshSpectrumRect();
        this.isSpectrumDragging = true;

        this.moveDragger(e);
    }

    private onSpectrumDraggerMove(e: MouseEvent) {
        if (this.isSpectrumDragging) {
            this.moveDragger(e);
        }
    }

    private onSpectrumHueDown(e: MouseEvent) {
        this.refreshHueRect();
        this.isSpectrumHueDragging = true;

        this.moveHueSlider(e);
    }

    private onSpectrumHueMove(e: MouseEvent) {
        if (this.isSpectrumHueDragging) {
            this.moveHueSlider(e);
        }
    }

    private onSpectrumAlphaDown(e: MouseEvent) {
        this.refreshAlphaRect();
        this.isSpectrumAlphaDragging = true;

        this.moveAlphaSlider(e);
    }

    private onSpectrumAlphaMove(e: MouseEvent) {
        if (this.isSpectrumAlphaDragging) {
            this.moveAlphaSlider(e);
        }
    }

    private onMouseUp() {
        this.isSpectrumDragging = false;
        this.isSpectrumHueDragging = false;
        this.isSpectrumAlphaDragging = false;
    }

    private moveDragger(e: MouseEvent | KeyboardEvent) {
        const valRect = this.spectrumValRect;
        if (!valRect) {
            return;
        }

        let x: number;
        let y: number;

        if (e instanceof MouseEvent) {
            x = e.clientX - valRect.left;
            y = e.clientY - valRect.top;
        } else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            const isUp = e.key === KeyCode.UP;
            const isDown = e.key === KeyCode.DOWN;
            const isVertical = isUp || isDown;
            const isHorizontal = isLeft || isRight;

            if (!isVertical && !isHorizontal) {
                return;
            }
            e.preventDefault();

            const { x: currentX, y: currentY } = this.getSpectrumValue();
            x = currentX + (isHorizontal ? (isLeft ? -5 : 5) : 0);
            y = currentY + (isVertical ? (isUp ? -5 : 5) : 0);
        }

        x = Math.max(x, 0);
        x = Math.min(x, valRect.width);
        y = Math.max(y, 0);
        y = Math.min(y, valRect.height);

        this.setSpectrumValue(x / valRect.width, 1 - y / valRect.height);
    }

    private moveHueSlider(e: MouseEvent | KeyboardEvent) {
        const rect = this.spectrumHueRect;

        if (!rect) {
            return;
        }

        const x = this.moveSlider(this.spectrumHueSlider, e);

        if (x == null) {
            return;
        }

        this.H = 1 - x / rect.width;
        this.update();
    }

    private moveAlphaSlider(e: MouseEvent | KeyboardEvent) {
        const rect = this.spectrumAlphaRect;

        if (!rect) {
            return;
        }

        const x = this.moveSlider(this.spectrumAlphaSlider, e);

        if (x == null) {
            return;
        }

        this.A = x / rect.width;
        this.update();
    }

    private moveSlider(slider: HTMLElement, e: MouseEvent | KeyboardEvent): number | null {
        const sliderRect = slider.getBoundingClientRect();
        const parentRect = slider.parentElement?.getBoundingClientRect();

        if (!slider || !parentRect) {
            return null;
        }

        const offset = sliderRect.width / 2;

        let x: number;
        if (e instanceof MouseEvent) {
            x = Math.floor(e.clientX - parentRect.left);
        } else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            if (!isLeft && !isRight) {
                return null;
            }
            e.preventDefault();
            const diff = isLeft ? -5 : 5;
            x = parseFloat(slider.style.left) + offset + diff;
        }

        x = Math.max(x, 0);
        x = Math.min(x, parentRect.width);

        slider.style.left = x - offset + 'px';

        return x;
    }

    private update(suppressColorInputUpdate?: boolean) {
        const { A, S, B, H, _Color } = this;
        const hue = H * 360;
        const color = _Color.fromHSB(hue, S, B, A);
        const rgbaColor = color.toRgbaString();
        const colorWithoutAlpha = _Color.fromHSB(hue, S, B);
        const rgbaColorWithoutAlpha = colorWithoutAlpha.toRgbaString();
        const spectrumColor = _Color.fromHSB(hue, 1, 1);
        const spectrumRgbaColor = spectrumColor.toRgbaString();

        // the recent color list needs to know color has actually changed
        const colorPicker = this.picker as AgColorPicker;

        const existingColor = _Color.fromString(colorPicker.getValue());
        if (existingColor.toRgbaString() !== rgbaColor) {
            this.colorChanged = true;
        }

        colorPicker.setValue(rgbaColor);

        this.spectrumColor.style.backgroundColor = spectrumRgbaColor;
        this.spectrumDragger.style.backgroundColor = rgbaColorWithoutAlpha;

        this.spectrumHueSlider.style.backgroundColor = spectrumRgbaColor;

        this.spectrumAlpha.style.setProperty(
            '--ag-internal-spectrum-alpha-color-from',
            _Color.fromHSB(hue, S, B, 0).toRgbaString()
        );
        this.spectrumAlpha.style.setProperty('--ag-internal-spectrum-alpha-color-to', rgbaColorWithoutAlpha);
        this.spectrumAlpha.style.setProperty('--ag-internal-spectrum-alpha-color', rgbaColor);

        if (!suppressColorInputUpdate) {
            this.colorInput.setColor(color);
        }
    }

    /**
     * @param saturation In the [0, 1] interval.
     * @param brightness In the [0, 1] interval.
     */
    public setSpectrumValue(saturation: number, brightness: number, suppressColorInputUpdate?: boolean) {
        const valRect = this.spectrumValRect || this.refreshSpectrumRect();

        if (valRect == null) {
            return;
        }

        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();

        saturation = Math.max(0, saturation);
        saturation = Math.min(1, saturation);
        brightness = Math.max(0, brightness);
        brightness = Math.min(1, brightness);

        this.S = saturation;
        this.B = brightness;

        dragger.style.left = saturation * valRect.width - draggerRect.width / 2 + 'px';
        dragger.style.top = (1 - brightness) * valRect.height - draggerRect.height / 2 + 'px';

        this.update(suppressColorInputUpdate);
    }

    private getSpectrumValue(): { x: number; y: number } {
        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();

        const x = parseFloat(dragger.style.left) + draggerRect.width / 2;
        const y = parseFloat(dragger.style.top) + draggerRect.height / 2;

        return { x, y };
    }

    private initRecentColors() {
        const recentColors = sharedRecentColors;
        const innerHtml = recentColors.map((color: string, index: number) => {
            return /* html */ `<div class="ag-recent-color" id=${index} style="background-color: ${color}; width: 15px; height: 15px;" recent-color="${color}" tabIndex="${this.tabIndex}"></div>`;
        });

        this.recentColors.innerHTML = innerHtml.join('');
        _setDisplayed(this.recentColors, !!recentColors.length);
    }

    public setValue(val: string): void {
        const color = this._Color.fromString(val);
        this.setColor(color, true);
    }

    private setColor(color: IColor, updateColorInput?: boolean): void {
        const [h, s, b] = color.toHSB();

        this.H = (isNaN(h) ? 0 : h) / 360;
        this.A = color.a;

        const spectrumHueRect = this.spectrumHueRect || this.refreshHueRect();
        const spectrumAlphaRect = this.spectrumAlphaRect || this.refreshAlphaRect();

        this.spectrumHueSlider.style.left = `${(this.H - 1) * -spectrumHueRect.width - this.spectrumHueSlider.getBoundingClientRect().width / 2}px`;
        this.spectrumAlphaSlider.style.left = `${this.A * spectrumAlphaRect.width - this.spectrumAlphaSlider.getBoundingClientRect().width / 2}px`;

        this.setSpectrumValue(s, b, !updateColorInput);
    }

    private onRecentColorClick(e: MouseEvent | KeyboardEvent) {
        const target = e.target as HTMLElement;

        if (!_exists(target.id)) {
            return;
        }

        const id = parseInt(target.id, 10);

        this.setValue(sharedRecentColors[id]);
        this.destroy();
    }

    private addRecentColor() {
        const color = this._Color.fromHSB(this.H * 360, this.S, this.B, this.A);
        const rgbaColor = color.toRgbaString();

        let recentColors = sharedRecentColors;

        if (!this.colorChanged || recentColors[0] === rgbaColor) {
            return;
        }

        // remove duplicate color
        recentColors = recentColors.filter((currentColor) => currentColor != rgbaColor);

        // add color to head
        recentColors = [rgbaColor].concat(recentColors);

        // ensure we don't exceed max number of recent colors
        if (recentColors.length > maxRecentColors) {
            recentColors = recentColors.slice(0, maxRecentColors);
        }

        sharedRecentColors = recentColors;
    }

    public override destroy(): void {
        this.addRecentColor();
        super.destroy();
    }
}
