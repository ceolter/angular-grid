import type { Group } from '@tweenjs/tween.js';

import type { AgElementFinder } from '../agElements';
import type { AgElementName } from '../agElements/agElementsConfig';
import { AG_CHART_TAB, AG_SCROLLABLE_CONTAINER_SELECTOR } from '../constants';
import type { Mouse } from '../createMouse';
import { isInViewport } from '../dom';
import type { ScriptDebugger } from '../scriptDebugger';
import type { EasingFunction } from '../tween';
import { createMoveMouse } from './createMoveMouse';
import { mouseClick } from './mouseClick';
import { waitFor } from './waitFor';

interface MoveToElementAndClickParams {
    agElementFinder: AgElementFinder;
    target: AgElementName;
    targetParams: any;
    mouse: Mouse;
    tweenGroup: Group;
    scrollOffsetY?: number;
    speed?: number;
    duration?: number;
    /**
     * Easing function
     *
     * @see https://createjs.com/docs/tweenjs/classes/Ease.html
     */
    easing?: EasingFunction;
    scriptDebugger?: ScriptDebugger;
}

export async function moveToElementAndClick({
    agElementFinder,
    target,
    targetParams,
    mouse,
    scrollOffsetY = 0,
    speed,
    duration,
    tweenGroup,
    easing,
    scriptDebugger,
}: MoveToElementAndClickParams) {
    let element = agElementFinder.get(target, targetParams);
    if (!element) {
        throw new Error(`No element found: ${target} - ${JSON.stringify(targetParams)}`);
    }

    // Same logic as [tabbedChartMenu](https://github.com/ag-grid/ag-grid/blob/3d71e5b4e4c0fcba593d6783a7ba1f815c32e2f8/enterprise-modules/charts/src/charts/chartComp/menu/tabbedChartMenu.ts#L78)
    const scrollContainer = (element.get()?.closest(AG_SCROLLABLE_CONTAINER_SELECTOR) ||
        element.get()?.closest(AG_CHART_TAB)) as HTMLElement;
    if (scrollContainer && !isInViewport({ element: element.get()!, threshold: 0.5, scrollContainer })) {
        const elRect = element.get()!.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const top = elRect.top - containerRect.top + scrollContainer.scrollTop + scrollOffsetY;

        scrollContainer.scrollTo({
            top,
            behavior: 'smooth',
        });

        await waitFor(400);

        // Recalculate element, because of scroll
        element = agElementFinder.get(target, targetParams);
    }

    const toPos = element?.getPos();
    if (!toPos) {
        throw new Error(`Element position not found: ${target} - ${JSON.stringify(targetParams)}`);
    }

    await createMoveMouse({
        mouse,
        toPos,
        speed,
        duration,
        tweenGroup,
        easing,
        scriptDebugger,
    });

    await waitFor(500);

    if (element?.useMouseDown) {
        return mouseClick({
            mouse,
            coords: toPos,
            scriptDebugger,
        });
    } else {
        mouse.click();
        await waitFor(200);
        element?.get()?.click();
    }
}
