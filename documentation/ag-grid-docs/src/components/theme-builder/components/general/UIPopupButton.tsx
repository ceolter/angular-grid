import styled from '@emotion/styled';
import {
    type Placement,
    type UseFloatingOptions,
    autoPlacement,
    autoUpdate,
    offset,
    shift,
    useFloating,
} from '@floating-ui/react';
import { type ReactNode, useState } from 'react';
import type React from 'react';

import { combineClassNames, useClickAwayListener } from '../component-utils';
import { Card } from './Card';

export type UIPopupButtonProps = {
    dropdownContent: ReactNode;
    children: ReactNode;
    startDecorator?: React.ReactNode;
    endDecorator?: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
    allowedPlacements?: Placement[];
    offset?: number;
};

/**
 * A version of MUI's menu component that can contain interactive UI in the dropdown. It doesn't close until you click outside the dropdown.
 */
export const UIPopupButton = (props: UIPopupButtonProps) => {
    const floatingOptions: Partial<UseFloatingOptions> = {
        whileElementsMounted: autoUpdate,
        middleware: [
            autoPlacement({ allowedPlacements: props.allowedPlacements || ['right'] }),
            offset(8),
            shift({ padding: 8 }),
        ],
    };
    const { refs, floatingStyles, elements } = useFloating(floatingOptions);
    const [show, setShow] = useState(false);

    useClickAwayListener(() => setShow(false), [elements.domReference, elements.floating]);

    return (
        <>
            <Button
                className={combineClassNames(
                    props.className,
                    show && 'is-dropdown-visible',
                    `variant-${props.variant || 'primary'}`
                )}
                onClick={() => setShow(!show)}
                ref={refs.setReference}
                color="neutral"
            >
                {props.startDecorator}
                {props.children}
                {props.endDecorator}
            </Button>
            {show && (
                <DropdownArea ref={refs.setFloating} style={floatingStyles}>
                    <div className="dropdownWrapper">{props.dropdownContent}</div>
                </DropdownArea>
            )}
        </>
    );
};

export const Button = styled('button')`
    height: 44px;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    padding: 0 16px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0px 3.76px 3.76px 0px hsla(0, 0%, 0%, 0.06);
    width: 100%;

    &.variant-secondary {
        background-color: var(--color-button-tertiary-bg);
        color: var(--color-button-tertiary-fg);
        border: 1px solid var(--color-button-tertiary-border);

        &:hover {
            color: var(--color-fg-primary);
            background-color: var(--color-bg-secondary);
        }
    }
`;

const DropdownArea = styled(Card)`
    z-index: 1000;
    position: absolute;
    pointer-events: all;
    max-height: calc(100vh - 16px);
    padding: 16px;
    overflow: auto;

    .dropdownWrapper {
        @keyframes scaleIn {
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
        animation: scaleIn 0.1s;
    }
`;
