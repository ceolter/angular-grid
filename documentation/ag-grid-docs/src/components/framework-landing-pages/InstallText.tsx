import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import AngularIcon from '@ag-website-shared/images/inline-svgs/angular.svg?react';
import JavaScriptIcon from '@ag-website-shared/images/inline-svgs/javascript.svg?react';
import ReactIcon from '@ag-website-shared/images/inline-svgs/react.svg?react';
import VueIcon from '@ag-website-shared/images/inline-svgs/vue.svg?react';
import { useFrameworkSelector } from '@ag-website-shared/utils/useFrameworkSelector';
import { useRef, useState } from 'react';

import styles from './InstallText.module.scss';

const FRAMEWORK_CONFIGS: Record<Framework, { Icon: any; command: string; name: string }> = {
    react: {
        Icon: ReactIcon,
        command: 'npm install ag-grid-react',
        name: 'React',
    },
    angular: {
        Icon: AngularIcon,
        command: 'npm install ag-grid-angular',
        name: 'Angular',
    },
    vue: {
        Icon: VueIcon,
        command: 'npm install ag-grid-vue-3',
        name: 'Vue',
    },
    javascript: {
        Icon: JavaScriptIcon,
        command: 'npm install ag-grid-community',
        name: 'JavaScript',
    },
};

const InstallText = () => {
    const { framework, handleFrameworkChange } = useFrameworkSelector();
    const [iconState, setIconState] = useState<'copy' | 'animating' | 'tick'>('copy');
    const [isHovering, setIsHovering] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const installTextRef = useRef(null);
    const containerRef = useRef(null);
    const copyButtonRef = useRef(null);
    const overlayTimerRef = useRef(null);

    const copyToClipboard = () => {
        const text = installTextRef?.current?.innerText?.replace('$', '').trim();
        navigator.clipboard.writeText(text).then(() => {
            // Start the animation sequence
            setIconState('animating');

            // After a slight pause, show the tick
            setTimeout(() => {
                setIconState('tick');

                // After 2 seconds, return to copy icon
                setTimeout(() => {
                    setIconState('copy');
                }, 2000);
            }, 200); // slight pause before tick appears
        });
    };

    const handleFrameworkSelection = (newFramework: Framework) => {
        handleFrameworkChange(newFramework);
        setIsHovering(false);
        setIsHiding(true);
    };

    const handleMouseEnter = (e) => {
        // Only show overlay if not hovering over copy button
        if (copyButtonRef.current && !copyButtonRef.current.contains(e.target)) {
            // Clear any existing timeout
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
            }
            setIsHiding(false);
            setIsHovering(true);
        }
    };

    const handleMouseLeave = () => {
        // Set a timeout to allow moving between icon and dropdown
        overlayTimerRef.current = setTimeout(() => {
            if (containerRef.current && !containerRef.current.matches(':hover')) {
                setIsHiding(true);
                // After animation completes, set hovering to false
                setTimeout(() => {
                    setIsHovering(false);
                    setIsHiding(false);
                }, 150); // match animation duration
            }
        }, 100);
    };

    const CurrentIcon = FRAMEWORK_CONFIGS[framework].Icon;
    const installCommand = FRAMEWORK_CONFIGS[framework].command;

    return (
        <div
            ref={containerRef}
            className={styles.installTextContainer}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span ref={installTextRef} className={styles.installText}>
                <div className={styles.frameworkIconWrapper}>
                    <CurrentIcon />
                </div>{' '}
                <span className={styles.installCommand}>$ {installCommand}</span>
            </span>
            <span
                ref={copyButtonRef}
                className={`plausible-event-name=react-table-copy-cta ${styles.copyButton} ${styles.copyIconAnimationContainer}`}
                onClick={copyToClipboard}
            >
                {iconState === 'copy' && (
                    <Icon key="copy-icon" svgClasses={`${styles.copyToClipboardIcon} ${styles.copyIcon}`} name="copy" />
                )}
                {iconState === 'animating' && <div className={styles.iconPlaceholder}></div>}
                {iconState === 'tick' && (
                    <Icon key="tick-icon" svgClasses={`${styles.copyToClipboardIcon} ${styles.tickIcon}`} name="tick" />
                )}
            </span>
            {isHovering && (
                <div
                    className={`
                        ${styles.frameworkOverlay} 
                        ${isHiding ? styles.hiding : styles.visible}
                    `}
                    onMouseEnter={() => {
                        if (overlayTimerRef.current) {
                            clearTimeout(overlayTimerRef.current);
                        }
                        setIsHiding(false);
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    {Object.keys(FRAMEWORK_CONFIGS).map((fw: Framework) => {
                        const FrameworkIcon = FRAMEWORK_CONFIGS[fw].Icon;
                        const name = FRAMEWORK_CONFIGS[fw].name;
                        const isCurrentFramework = framework === fw;
                        return (
                            <div
                                key={fw}
                                className={`
                                    ${styles.frameworkOption} 
                                    ${isCurrentFramework ? styles.currentFramework : ''}
                                `}
                                onClick={() => !isCurrentFramework && handleFrameworkSelection(fw)}
                            >
                                <FrameworkIcon />
                                <span>{name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InstallText;
