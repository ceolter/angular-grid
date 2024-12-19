import type { ForwardRefRenderFunction } from 'react';
import React, { forwardRef, memo, useCallback, useContext, useImperativeHandle, useRef } from 'react';

import type { GridCtrl, ITabGuard } from 'ag-grid-community';
import { TabGuardClassNames, TabGuardCtrl } from 'ag-grid-community';

import { BeansContext } from './beansContext';

export interface TabGuardCompCallback {
    forceFocusOutOfContainer(up?: boolean): void;
}

interface TabGuardProps {
    children: React.ReactNode;
    eFocusableElement: HTMLDivElement;
    forceFocusOutWhenTabGuardsAreEmpty?: boolean;
    gridCtrl: GridCtrl;
    onTabKeyDown: (e: KeyboardEvent) => void;
    isEmpty?: () => boolean;
}

const TabGuardCompRef: ForwardRefRenderFunction<TabGuardCompCallback, TabGuardProps> = (
    props: any,
    forwardRef: any
) => {
    const { children, eFocusableElement, onTabKeyDown, gridCtrl, forceFocusOutWhenTabGuardsAreEmpty, isEmpty } = props;
    const { context } = useContext(BeansContext);

    const topTabGuardRef = useRef<HTMLDivElement | null>(null);
    const bottomTabGuardRef = useRef<HTMLDivElement | null>(null);
    const tabGuardCtrlRef = useRef<TabGuardCtrl>();

    const setTabIndex = (value?: string | null) => {
        const processedValue = value == null ? undefined : parseInt(value, 10).toString();

        [topTabGuardRef, bottomTabGuardRef].forEach((tabGuard) => {
            if (processedValue === undefined) {
                tabGuard.current?.removeAttribute('tabindex');
            } else {
                tabGuard.current?.setAttribute('tabindex', processedValue);
            }
        });
    };

    useImperativeHandle(forwardRef, () => ({
        forceFocusOutOfContainer(up?: boolean) {
            tabGuardCtrlRef.current?.forceFocusOutOfContainer(up);
        },
    }));

    const setupCtrl = useCallback(() => {
        const topTabGuard = topTabGuardRef.current;
        const bottomTabGuard = bottomTabGuardRef.current;
        if (!topTabGuard && !bottomTabGuard) {
            // Clean up after both refs have been removed
            tabGuardCtrlRef.current = context.destroyBean(tabGuardCtrlRef.current);
            return;
        }

        if (topTabGuard && bottomTabGuard) {
            const compProxy: ITabGuard = {
                setTabIndex,
            };

            tabGuardCtrlRef.current = context.createBean(
                new TabGuardCtrl({
                    comp: compProxy,
                    eTopGuard: topTabGuard,
                    eBottomGuard: bottomTabGuard,
                    eFocusableElement: eFocusableElement,
                    onTabKeyDown: onTabKeyDown,
                    forceFocusOutWhenTabGuardsAreEmpty: forceFocusOutWhenTabGuardsAreEmpty,
                    focusInnerElement: (fromBottom: any) => gridCtrl.focusInnerElement(fromBottom),
                    isEmpty,
                })
            );
        }
    }, []);

    const setTopRef = useCallback(
        (e: HTMLDivElement | null) => {
            topTabGuardRef.current = e;
            setupCtrl();
        },
        [setupCtrl]
    );
    const setBottomRef = useCallback(
        (e: HTMLDivElement | null) => {
            bottomTabGuardRef.current = e;
            setupCtrl();
        },
        [setupCtrl]
    );

    const createTabGuard = (side: 'top' | 'bottom') => {
        const className = side === 'top' ? TabGuardClassNames.TAB_GUARD_TOP : TabGuardClassNames.TAB_GUARD_BOTTOM;

        return (
            <div
                className={`${TabGuardClassNames.TAB_GUARD} ${className}`}
                role="presentation"
                ref={side === 'top' ? setTopRef : setBottomRef}
            ></div>
        );
    };

    return (
        <>
            {createTabGuard('top')}
            {children}
            {createTabGuard('bottom')}
        </>
    );
};

const TabGuardComp = forwardRef(TabGuardCompRef);

export default memo(TabGuardComp);
