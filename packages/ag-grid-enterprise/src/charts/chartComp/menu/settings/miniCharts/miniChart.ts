import type { Group, Scene } from 'ag-charts-types/scene';

import type { BeanCollection } from 'ag-grid-community';
import { Component, _error } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../agChartsExports';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';

const CANVAS_CLASS = 'ag-chart-mini-thumbnail-canvas';

export abstract class MiniChart extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    protected readonly size: number = 58;
    protected readonly padding: number = 5;
    protected readonly root: Group;
    protected readonly scene: Scene;

    constructor(
        container: HTMLElement,
        protected readonly agChartsExports: AgChartsExports,
        protected tooltipName: ChartTranslationKey
    ) {
        super();

        const { _Scene } = agChartsExports;

        this.root = new _Scene.Group();
        const scene = new _Scene.Scene({
            width: this.size,
            height: this.size,
        });

        scene.canvas.element.classList.add(CANVAS_CLASS);
        scene.setRoot(this.root);
        scene.setContainer(container);

        this.scene = scene;
    }

    public postConstruct(): void {
        this.scene.canvas.element.title = this.chartTranslation.translate(this.tooltipName);

        // Necessary to force scene graph render as we are not using the standalone factory.
        try {
            this.scene.render();
        } catch (e) {
            _error(108, { e });
        }
    }

    abstract updateColors(fills: string[], strokes: string[]): void;
}
