import type { Group } from '@tweenjs/tween.js';
import { Tween } from '@tweenjs/tween.js';

import type { Mouse } from '../createMouse';
import { getOffset } from '../dom';
import type { Point } from '../geometry';
import type { ScriptDebugger } from '../scriptDebugger';
import { getTweenDuration } from '../tween';
import type { EasingFunction } from '../tween';
import { moveMouse } from './move';

interface CreateMoveMouseParams {
    mouse: Mouse;
    tweenGroup: Group;
    fromPos?: Point;
    toPos: Point;
    tweenOnChange?: (params: { coords: Point; elapsed: number }) => void;
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

function getTargetPos(target: HTMLElement): Point | undefined {
    if (!target) {
        return;
    }

    const transform = target.style.transform;
    const regex = /.*\((-?\d+(\.\d+)?)px, ?(-?\d+(\.\d+)?)px\)/;
    const matches = transform.match(regex);

    if (!matches) {
        return;
    }

    const offset = getOffset(target);

    return {
        x: parseInt(matches[1], 10) - offset.x,
        y: parseInt(matches[3], 10) - offset.y,
    };
}

export const createMoveMouse = ({
    mouse,
    tweenGroup,
    fromPos: startingFromPos,
    toPos,
    tweenOnChange,
    speed,
    duration,
    easing,
    scriptDebugger,
}: CreateMoveMouseParams): Promise<void> => {
    const fromPos = startingFromPos ? startingFromPos : getTargetPos(mouse.getTarget());
    const coords = { ...fromPos } as Point;

    if (!fromPos) {
        scriptDebugger?.errorLog(`No 'fromPos'`, {
            startingFromPos,
            target: mouse.getTarget(),
            toPos,
            speed,
            duration,
        });
        return Promise.reject(`No 'fromPos'`);
    }

    // NOTE: Need to get the offset at the beginning, rather than on update to account for initial scroll position
    const offset = mouse.getOffset();
    return new Promise((resolve) => {
        const tweenDuration = getTweenDuration({
            fromPos,
            toPos,
            speed,
            duration,
        });

        const tween = new Tween(coords, tweenGroup)
            .to(toPos, tweenDuration)
            .onUpdate((object: Point, elapsed) => {
                moveMouse({ mouse, coords: object, offset, scriptDebugger });
                tweenOnChange?.({ coords: object, elapsed });
            })
            .onComplete(() => {
                resolve();
            });
        if (easing) {
            tween.easing(easing);
        }

        tween.start();
    });
};
