import { getChangedModelItemCount } from '@components/theme-builder/model/changed-model-items';
import styled from '@emotion/styled';
import { useStore } from 'jotai';
import { type RefObject, memo, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { colorSchemeLight, themeQuartz } from 'ag-grid-community';

import { ResetChangesModal } from '../general/ResetChangesModal';
import { PresetRender } from './PresetRender';
import { type Preset, allPresets, applyPreset } from './presets';

export const PresetSelector = memo(() => {
    const scrollerRef = useRef<HTMLDivElement>(null);

    return (
        <Scroller ref={scrollerRef}>
            <Horizontal>
                {allPresets.map((preset, i) => (
                    <SelectButton key={i} preset={preset} scrollerRef={scrollerRef} />
                ))}
            </Horizontal>
        </Scroller>
    );
});

type SelectButtonProps = {
    preset: Preset;
    scrollerRef: RefObject<HTMLDivElement>;
};

const SelectButton = ({ preset, scrollerRef }: SelectButtonProps) => {
    const [showDialog, setShowDialog] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [themeClass, setThemeClass] = useState<string | undefined>();

    useLayoutEffect(() => {
        const wrapper = wrapperRef.current;
        if (wrapper) {
            let theme = themeQuartz.withPart(colorSchemeLight);
            if (preset.params) {
                theme = theme.withParams(preset.params);
            }
            for (const part of preset.parts || []) {
                theme = theme.withPart(part);
            }
            wrapper.style.setProperty('--page-background-color', preset.pageBackgroundColor);
            theme.startUse({ container: wrapper, loadThemeGoogleFonts: true });
            setThemeClass(theme.getCssClass());

            return () => theme.stopUse();
        }
    }, [preset]);

    const store = useStore();
    const selectNewPreset = useCallback(() => {
        applyPreset(store, preset);

        // Scroll to the snap center position
        const wrapper = wrapperRef.current;
        if (wrapper) {
            const scrollLeft = wrapper.offsetLeft - wrapper.clientWidth / 2;
            scrollerRef.current?.scrollTo({
                left: scrollLeft,
                behavior: 'smooth',
            });
        }
    }, [store, preset, scrollerRef]);

    return (
        <>
            <SelectButtonWrapper
                ref={wrapperRef}
                onClick={() => {
                    if (getChangedModelItemCount(store) > 1) {
                        setShowDialog(true);
                        return;
                    }
                    selectNewPreset();
                }}
                className={themeClass}
            >
                <PresetRender />
            </SelectButtonWrapper>

            <ResetChangesModal showDialog={showDialog} setShowDialog={setShowDialog} onSuccess={selectNewPreset} />
        </>
    );
};

const SelectButtonWrapper = styled('div')`
    display: inline-block;
    margin-right: 12px;
    scroll-snap-align: center;
    margin-bottom: 8px;

    // Higher z index than blur container z index
    &:first-of-type,
    &:last-of-type {
        z-index: 3;
    }
`;

const Horizontal = styled('div')`
    display: flex;
    height: 100%;
`;

const Scroller = styled('div')`
    --scroller-height: 192px;

    width: 100%;
    min-height: var(--scroller-height);
    overflow-x: auto;
    padding-bottom: 6px;
    z-index: 0; // z-index:0 prevents a Safari rendering bug where scrollbars appear over tooltips
    scroll-snap-type: x mandatory;

    // Blur beginning and end
    &:before,
    &:after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        height: calc(var(--scroller-height) - 14px);
        pointer-events: none;
        z-index: 2;
    }

    &:before {
        width: 100px;
        left: 10px;
        background: linear-gradient(
            to right,
            var(--color-bg-primary),
            color-mix(in srgb, var(--color-bg-primary), transparent 88%) 80%,
            transparent
        );
    }

    &:after {
        width: 128px;
        right: 0;
        background: linear-gradient(
            to left,
            var(--color-bg-primary),
            color-mix(in srgb, var(--color-bg-primary), transparent 33%) 50%,
            transparent
        );
    }
`;
