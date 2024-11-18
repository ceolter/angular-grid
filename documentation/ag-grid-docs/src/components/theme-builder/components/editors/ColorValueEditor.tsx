import styled from '@emotion/styled';
import { FloatingPortal, autoPlacement, autoUpdate, offset, useFloating } from '@floating-ui/react';
import { useEffect, useRef, useState } from 'react';
import { HexAlphaColorPicker, HexColorPicker } from 'react-colorful';

import { _theming } from 'ag-grid-community';

import { useClickAwayListener } from '../component-utils';
import { Card } from '../general/Card';
import { Input } from './Input';
import { RGBAColor } from './RGBAColor';
import { type ValueEditorProps } from './ValueEditorProps';

export const ColorValueEditor = ({ param, value, onChange }: ValueEditorProps<_theming.ColorValue>) => (
    <ColorEditor
        preventTransparency={param.property === 'backgroundColor'}
        value={_theming.paramValueToCss(param.property, value) || ''}
        onChange={onChange}
    />
);

export type ColorEditorProps = {
    preventTransparency: boolean;
    value: string;
    onChange: (newValue: string | null) => void;
};

export const ColorEditor = ({ preventTransparency, value, onChange }: ColorEditorProps) => {
    const hexValue = coerceToValidValue(value, preventTransparency);
    const [editorValue, setEditorValue] = useState(hexValue || value);
    const [valid, setValid] = useState(() => colorIsValid(editorValue));
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [showPicker, setShowPicker] = useState(false);

    const { refs, floatingStyles, elements } = useFloating({
        open: showPicker,
        onOpenChange: setShowPicker,
        whileElementsMounted: autoUpdate,
        middleware: [
            autoPlacement({
                allowedPlacements: ['bottom-start', 'bottom-end', 'top-start', 'bottom-end'],
            }),
            offset({ mainAxis: 6 }),
        ],
    });

    useClickAwayListener(() => setShowPicker(false), [elements.domReference, elements.floating, wrapperRef.current]);

    useEffect(() => {
        if (!showPicker) {
            setEditorValue(hexValue || value);
        }
        // deliberately reduced dependencies array
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hexValue]);

    const handleInput = (newValue: string) => {
        newValue = newValue.trim();
        setEditorValue(newValue);
        if (newValue === '') {
            onChange(null);
            setValid(true);
        } else {
            const isValid = colorIsValid(newValue);
            setValid(isValid);
            if (isValid) {
                onChange(coerceToValidValue(newValue, preventTransparency));
            }
        }
    };

    const ColorPicker = preventTransparency ? HexColorPicker : HexAlphaColorPicker;

    return (
        <>
            <Wrapper ref={wrapperRef}>
                <StyledInput
                    ref={refs.setReference}
                    className={valid ? undefined : 'is-error'}
                    value={editorValue}
                    onChange={handleInput}
                    onFocus={() => {
                        setShowPicker(true);
                        setEditorValue(coerceToValidValue(value, preventTransparency));
                    }}
                    onBlur={() => {
                        setEditorValue(coerceToValidValue(value, preventTransparency));
                        setValid(colorIsValid(value));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Tab' || e.key === 'Escape') {
                            setShowPicker(false);
                        }
                    }}
                />
                <ColorSwatch onClick={() => setShowPicker(!showPicker)}>
                    <ColorSwatchColor style={{ backgroundColor: hexValue }} />
                </ColorSwatch>
            </Wrapper>
            {showPicker && (
                <FloatingPortal>
                    <DropdownArea ref={refs.setFloating} style={floatingStyles}>
                        <div className="colorPickerWrapper">
                            <ColorPicker color={hexValue} onChange={(h) => handleInput(h.toUpperCase())} />
                        </div>
                    </DropdownArea>
                </FloatingPortal>
            )}
        </>
    );
};

const coerceToValidValue = (input: string, preventTransparency: boolean) => {
    let color = RGBAColor.parseCss(input);
    if (!color) {
        color = RGBAColor.reinterpretCss(input);
    }
    if (!color) return input;
    if (preventTransparency) {
        color.a = 1;
    }
    return color.toCSSHex();
};

const colorIsValid = (value: string) => RGBAColor.reinterpretCss(value) != null;

const Wrapper = styled('div')`
    position: relative;
`;

const StyledInput = styled(Input)`
    padding-left: 38px !important;
`;

const alphaPatternSvg =
    'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgba(128, 128, 128, 0.3)"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>';

const ColorSwatch = styled('div')`
    border-radius: 4px;
    overflow: hidden;
    position: absolute;
    top: 50%;
    margin-top: -11px;
    left: 6px;
    width: 22px;
    height: 22px;
    outline: 1px solid var(--color-border-primary);
    background-color: var(--color-bg-primary);
    background-image: url('${alphaPatternSvg}');
    background-repeat: repeat;
    background-size: 8px;
    cursor: pointer;
    &:hover {
        outline: 1px solid rgba(0, 0, 0, 0.3);
    }
`;

const ColorSwatchColor = styled('div')`
    width: 100%;
    height: 100%;
`;

const DropdownArea = styled(Card)`
    .colorPickerWrapper {
        @keyframes scaleInUp {
            from {
                opacity: 0;
                transform: scale(0);
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: scale(1);
                transform: translateY(0px);
            }
        }

        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        animation: scaleInUp 0.1s;
    }

    z-index: 1000;
    position: absolute;
    pointer-events: all;
    max-height: calc(100vh - 16px);
    padding: 6px;

    .react-colorful {
        width: 255px;
    }
    .react-colorful__saturation {
        height: 255px;
        border-radius: 5px;
        margin-bottom: 12px;
    }
    .react-colorful__hue,
    .react-colorful__alpha {
        height: 18px;
        border-radius: 6px;
        margin-bottom: 12px;
    }

    .react-colorful__alpha {
        background-image: url('${alphaPatternSvg}');
        background-repeat: repeat;
        background-size: 8px;
    }

    .react-colorful__pointer {
        width: 20px;
        height: 20px;
        border-width: 3px;
    }

    .react-colorful__last-control {
        margin-bottom: 2px;
    }
`;
