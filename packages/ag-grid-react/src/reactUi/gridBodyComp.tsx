import React, { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { ComponentSelector, IGridBodyComp, RowContainerName } from 'ag-grid-community';
import {
    CssClassManager,
    FakeHScrollComp,
    FakeVScrollComp,
    GridBodyCtrl,
    _observeResize,
    _setAriaColCount,
    _setAriaRowCount,
} from 'ag-grid-community';

import { BeansContext } from './beansContext';
import GridHeaderComp from './header/gridHeaderComp';
import useReactCommentEffect from './reactComment';
import RowContainerComp from './rows/rowContainerComp';
import { classesList } from './utils';

interface SectionProperties {
    section: React.RefObject<HTMLDivElement>;
    className: string;
    style?: React.CSSProperties;
}

const GridBodyComp = () => {
    const { context, gos, overlays } = useContext(BeansContext);

    const [rowAnimationClass, setRowAnimationClass] = useState<string>('');
    const [topHeight, setTopHeight] = useState<number>(0);
    const [bottomHeight, setBottomHeight] = useState<number>(0);
    const [stickyTopHeight, setStickyTopHeight] = useState<string>('0px');
    const [stickyTopTop, setStickyTopTop] = useState<string>('0px');
    const [stickyTopWidth, setStickyTopWidth] = useState<string>('100%');
    const [stickyBottomHeight, setStickyBottomHeight] = useState<string>('0px');
    const [stickyBottomBottom, setStickyBottomBottom] = useState<string>('0px');
    const [stickyBottomWidth, setStickyBottomWidth] = useState<string>('100%');
    const [topDisplay, setTopDisplay] = useState<string>('');
    const [bottomDisplay, setBottomDisplay] = useState<string>('');

    const [forceVerticalScrollClass, setForceVerticalScrollClass] = useState<string | null>(null);
    const [topAndBottomOverflowY, setTopAndBottomOverflowY] = useState<string>('');
    const [cellSelectableCss, setCellSelectableCss] = useState<string | null>(null);

    // we initialise layoutClass to 'ag-layout-normal', because if we don't, the comp will initially
    // render with no width (as ag-layout-normal sets width to 0, which is needed for flex) which
    // gives the grid a massive width, which then renders a massive amount of columns. this problem
    // is due to React been async, for the non-async version (ie when not using React) this is not a
    // problem as the UI will finish initialising before we set data.
    const [layoutClass, setLayoutClass] = useState<string>('ag-layout-normal');

    const cssClassManager = useRef<CssClassManager>();
    if (!cssClassManager.current) {
        cssClassManager.current = new CssClassManager(() => eRoot.current);
    }

    const eRoot = useRef<HTMLDivElement | null>(null);
    const eTop = useRef<HTMLDivElement>(null);
    const eStickyTop = useRef<HTMLDivElement>(null);
    const eStickyBottom = useRef<HTMLDivElement>(null);
    const eBody = useRef<HTMLDivElement>(null);
    const eBodyViewport = useRef<HTMLDivElement>(null);
    const eBottom = useRef<HTMLDivElement>(null);

    const beansToDestroy = useRef<any[]>([]);
    const destroyFuncs = useRef<(() => void)[]>([]);

    useReactCommentEffect(' AG Grid Body ', eRoot);
    useReactCommentEffect(' AG Pinned Top ', eTop);
    useReactCommentEffect(' AG Sticky Top ', eStickyTop);
    useReactCommentEffect(' AG Middle ', eBodyViewport);
    useReactCommentEffect(' AG Pinned Bottom ', eBottom);

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eRoot.current = eRef;
        if (!eRef) {
            beansToDestroy.current = context.destroyBeans(beansToDestroy.current);
            destroyFuncs.current.forEach((f) => f());
            destroyFuncs.current = [];

            return;
        }

        if (!context) {
            return;
        }

        const attachToDom = (eParent: HTMLElement, eChild: HTMLElement | Comment) => {
            eParent.appendChild(eChild);
            destroyFuncs.current.push(() => eParent.removeChild(eChild));
        };
        const newComp = (compClass: ComponentSelector['component']) => {
            const comp = context.createBean(new compClass());
            beansToDestroy.current.push(comp);
            return comp;
        };
        const addComp = (eParent: HTMLElement, compClass: ComponentSelector['component'], comment: string) => {
            attachToDom(eParent, document.createComment(comment));
            attachToDom(eParent, newComp(compClass).getGui());
        };

        addComp(eRef, FakeHScrollComp, ' AG Fake Horizontal Scroll ');
        const overlayComp = overlays?.getOverlayWrapperCompClass();
        if (overlayComp) {
            addComp(eRef, overlayComp, ' AG Overlay Wrapper ');
        }

        if (eBody.current) {
            addComp(eBody.current, FakeVScrollComp, ' AG Fake Vertical Scroll ');
        }
        const compProxy: IGridBodyComp = {
            setRowAnimationCssOnBodyViewport: setRowAnimationClass,
            setColumnCount: (count: number) => {
                if (eRoot.current) {
                    _setAriaColCount(eRoot.current, count);
                }
            },
            setRowCount: (count: number) => {
                if (eRoot.current) {
                    _setAriaRowCount(eRoot.current, count);
                }
            },
            setTopHeight,
            setBottomHeight,
            setStickyTopHeight,
            setStickyTopTop,
            setStickyTopWidth,
            setTopDisplay,
            setBottomDisplay,
            setColumnMovingCss: (cssClass: string, flag: boolean) =>
                cssClassManager.current!.addOrRemoveCssClass(cssClass, flag),
            updateLayoutClasses: setLayoutClass,
            setAlwaysVerticalScrollClass: setForceVerticalScrollClass,
            setPinnedTopBottomOverflowY: setTopAndBottomOverflowY,
            setCellSelectableCss: (cssClass: string, flag: boolean) => setCellSelectableCss(flag ? cssClass : null),
            setBodyViewportWidth: (width: string) => {
                if (eBodyViewport.current) {
                    eBodyViewport.current.style.width = width;
                }
            },
            registerBodyViewportResizeListener: (listener: () => void) => {
                if (eBodyViewport.current) {
                    const unsubscribeFromResize = _observeResize(gos, eBodyViewport.current, listener);
                    destroyFuncs.current.push(() => unsubscribeFromResize());
                }
            },
            setStickyBottomHeight,
            setStickyBottomBottom,
            setStickyBottomWidth,
        };

        const ctrl = context.createBean(new GridBodyCtrl());
        beansToDestroy.current.push(ctrl);
        ctrl.setComp(
            compProxy,
            eRef,
            eBodyViewport.current!,
            eTop.current!,
            eBottom.current!,
            eStickyTop.current!,
            eStickyBottom.current!
        );
    }, []);

    const rootClasses = useMemo(() => classesList('ag-root', 'ag-unselectable', layoutClass), [layoutClass]);
    const bodyViewportClasses = useMemo(
        () =>
            classesList(
                'ag-body-viewport',
                rowAnimationClass,
                layoutClass,
                forceVerticalScrollClass,
                cellSelectableCss
            ),
        [rowAnimationClass, layoutClass, forceVerticalScrollClass, cellSelectableCss]
    );
    const bodyClasses = useMemo(() => classesList('ag-body', layoutClass), [layoutClass]);
    const topClasses = useMemo(() => classesList('ag-floating-top', cellSelectableCss), [cellSelectableCss]);
    const stickyTopClasses = useMemo(() => classesList('ag-sticky-top', cellSelectableCss), [cellSelectableCss]);
    const stickyBottomClasses = useMemo(
        () => classesList('ag-sticky-bottom', stickyBottomHeight === '0px' ? 'ag-hidden' : null, cellSelectableCss),
        [cellSelectableCss, stickyBottomHeight]
    );
    const bottomClasses = useMemo(() => classesList('ag-floating-bottom', cellSelectableCss), [cellSelectableCss]);

    const topStyle: React.CSSProperties = useMemo(
        () => ({
            height: topHeight,
            minHeight: topHeight,
            display: topDisplay,
            overflowY: topAndBottomOverflowY as any,
        }),
        [topHeight, topDisplay, topAndBottomOverflowY]
    );

    const stickyTopStyle: React.CSSProperties = useMemo(
        () => ({
            height: stickyTopHeight,
            top: stickyTopTop,
            width: stickyTopWidth,
        }),
        [stickyTopHeight, stickyTopTop, stickyTopWidth]
    );

    const stickyBottomStyle: React.CSSProperties = useMemo(
        () => ({
            height: stickyBottomHeight,
            bottom: stickyBottomBottom,
            width: stickyBottomWidth,
        }),
        [stickyBottomHeight, stickyBottomBottom, stickyBottomWidth]
    );

    const bottomStyle: React.CSSProperties = useMemo(
        () => ({
            height: bottomHeight,
            minHeight: bottomHeight,
            display: bottomDisplay,
            overflowY: topAndBottomOverflowY as any,
        }),
        [bottomHeight, bottomDisplay, topAndBottomOverflowY]
    );

    const createRowContainer = (container: RowContainerName) => (
        <RowContainerComp name={container} key={`${container}-container`} />
    );
    const createSection = ({
        section,
        children,
        className,
        style,
    }: SectionProperties & { children: RowContainerName[] }) => (
        <div ref={section} className={className} role="presentation" style={style}>
            {children.map(createRowContainer)}
        </div>
    );

    return (
        <div ref={setRef} className={rootClasses} role="treegrid">
            <GridHeaderComp />
            {createSection({
                section: eTop,
                className: topClasses,
                style: topStyle,
                children: ['topLeft', 'topCenter', 'topRight', 'topFullWidth'],
            })}
            <div className={bodyClasses} ref={eBody} role="presentation">
                {createSection({
                    section: eBodyViewport,
                    className: bodyViewportClasses,
                    children: ['left', 'center', 'right', 'fullWidth'],
                })}
            </div>
            {createSection({
                section: eStickyTop,
                className: stickyTopClasses,
                style: stickyTopStyle,
                children: ['stickyTopLeft', 'stickyTopCenter', 'stickyTopRight', 'stickyTopFullWidth'],
            })}
            {createSection({
                section: eStickyBottom,
                className: stickyBottomClasses,
                style: stickyBottomStyle,
                children: ['stickyBottomLeft', 'stickyBottomCenter', 'stickyBottomRight', 'stickyBottomFullWidth'],
            })}
            {createSection({
                section: eBottom,
                className: bottomClasses,
                style: bottomStyle,
                children: ['bottomLeft', 'bottomCenter', 'bottomRight', 'bottomFullWidth'],
            })}
        </div>
    );
};

export default memo(GridBodyComp);
