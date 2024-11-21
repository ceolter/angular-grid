import type { FunctionComponent, ReactElement } from 'react';
import AnimateHeight from 'react-animate-height';

interface Props {
    id?: string;
    isDisabled?: boolean;
    isOpen: boolean;
    animationDuration?: number;
    children: ReactElement;
}

export const Collapsible: FunctionComponent<Props> = ({
    id,
    isDisabled,
    isOpen,
    animationDuration = 330,
    children,
}) => {
    if (isDisabled) {
        return children;
    }

    const onStart = () => {
        document.body.classList.add('no-overflow-anchor');
    };

    const onEnd = () => {
        document.body.classList.remove('no-overflow-anchor');
    };

    const height = isOpen ? 'auto' : 0;

    return (
        <AnimateHeight
            id={id}
            duration={animationDuration}
            height={height}
            onHeightAnimationStart={onStart}
            onHeightAnimationEnd={onEnd}
        >
            {children}
        </AnimateHeight>
    );
};
