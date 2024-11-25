import { type ReactNode, memo, useEffect, useRef } from 'react';

import type { Theme } from 'ag-grid-community';
import { _theming } from 'ag-grid-community';

/**
 * A version of React.memo with types fixed so that it doesn't break generic components
 */
export const memoWithSameType = <T extends (...args: any[]) => ReactNode>(c: T): T => memo(c) as unknown as T;

/**
 * A version of React.useEffect that bypasses ESLint's
 * react-hooks/exhaustive-deps rule, because sometimes you don't an effect
 * that uses a variable but doesn't need to fire when those variables change
 *
 * One could use an eslint-disable comment, but this seems more intentional
 */
export const useEffectWithCustomDependencies = useEffect;

const notCalled: unique symbol = Symbol('notCalled');
type NotCalled = typeof notCalled;

export const useChangeHandler = <T>(value: T, handler: (value: T) => void, suppressInitially?: boolean) => {
    const lastValueRef = useRef<T | NotCalled>(notCalled);
    const suppressRef = useRef(!!suppressInitially);

    useEffectWithCustomDependencies(() => {
        if (lastValueRef.current !== value && lastValueRef.current !== notCalled && !suppressRef.current) {
            handler(value);
        }
        lastValueRef.current = value;
    }, [value]);

    return () => {
        suppressRef.current = false;
    };
};

export const combineClassNames = (...classNames: (string | undefined | false)[]) =>
    classNames.filter(Boolean).join(' ') || undefined;

export const useClickAwayListener = (onHide: () => void, ignoreElements: Array<Element | null | undefined>) => {
    const ignoreElementsRef = useRef(ignoreElements);
    ignoreElementsRef.current = ignoreElements;

    const ignore = useRef(false);

    useEffect(() => {
        const handleStart = (event: Event) => {
            ignore.current = ignoreElementsRef.current.some((el) => el?.contains(event.target as Node));
        };
        const handleEnd = () => {
            if (!ignore.current) {
                onHide();
            }
        };

        document.addEventListener('mousedown', handleStart);
        document.addEventListener('touchstart', handleStart);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousedown', handleStart);
            document.removeEventListener('touchstart', handleStart);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [onHide]);
};

export const getThemeDefaultParams = (theme: Theme) => _theming.asThemeImpl(theme)._getModeParams().$default ?? {};
