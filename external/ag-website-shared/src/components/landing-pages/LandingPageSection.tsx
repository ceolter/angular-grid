import { Icon } from '@ag-website-shared/components/icon/Icon';
import AngularIcon from '@ag-website-shared/images/inline-svgs/angular.svg?react';
import JavascriptIcon from '@ag-website-shared/images/inline-svgs/javascript.svg?react';
import ReactIcon from '@ag-website-shared/images/inline-svgs/react.svg?react';
import VueIcon from '@ag-website-shared/images/inline-svgs/vue.svg?react';
import classnames from 'classnames';
import { useRef, useState } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

const FRAMEWORK_CONFIGS = {
    react: {
        Icon: ReactIcon,
        name: 'React',
    },
    angular: {
        Icon: AngularIcon,
        name: 'Angular',
    },
    vue: {
        Icon: VueIcon,
        name: 'Vue',
    },
    javascript: {
        Icon: JavascriptIcon,
        name: 'JavaScript',
    },
};

interface Props {
    tag: string;
    heading?: string;
    headingHtml?: string;
    subHeading?: string;
    subHeadingHtml?: string;
    learnMoreTitle?: string;
    ctaTitle?: string;
    ctaUrl?: string;
    sectionClass?: string;
    showBackgroundGradient?: boolean;
    children: ReactNode;
    framework?: boolean;
}

export const LandingPageSection: FunctionComponent<Props> = ({
    tag,
    heading,
    headingHtml,
    subHeading,
    subHeadingHtml,
    ctaTitle,
    ctaUrl,
    sectionClass,
    showBackgroundGradient,
    children,
    framework = false,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [currentFramework, setCurrentFramework] = useState('react');
    const frameworkContainerRef = useRef<HTMLDivElement>(null);
    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleFrameworkChange = (framework: string) => {
        setCurrentFramework(framework);
        setIsHovering(false);
        setIsHiding(true);
    };

    const handleMouseEnter = () => {
        if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
        }
        setIsHiding(false);
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        overlayTimerRef.current = setTimeout(() => {
            if (frameworkContainerRef.current && !frameworkContainerRef.current.matches(':hover')) {
                setIsHiding(true);
                setTimeout(() => {
                    setIsHovering(false);
                    setIsHiding(false);
                }, 150);
            }
        }, 100);
    };

    const CurrentIcon = FRAMEWORK_CONFIGS[currentFramework].Icon;

    return (
        <div
            className={classnames(styles.sectionContent, sectionClass, {
                [styles.withBackgroundGradient]: showBackgroundGradient,
            })}
        >
            <header className={styles.headingContainer}>
                <h2 className={styles.tag}>{tag}</h2>

                {headingHtml ? (
                    <h3
                        className={styles.heading}
                        dangerouslySetInnerHTML={{ __html: decodeURIComponent(headingHtml) }}
                    />
                ) : (
                    <h3 className={styles.heading}>{heading}</h3>
                )}

                {subHeadingHtml ? (
                    <h4 className={styles.subHeading} dangerouslySetInnerHTML={{ __html: subHeadingHtml }}></h4>
                ) : (
                    <h4 className={styles.subHeading}>{subHeading}</h4>
                )}

                <div className={styles.frameworkGroup}>
                    {framework && (
                        <div
                            ref={frameworkContainerRef}
                            className={classnames([styles.ctaButton, 'button-tertiary'])}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className={styles.frameworkSelector}>
                                <CurrentIcon />{' '}
                                <span className={styles.framework}>
                                    {FRAMEWORK_CONFIGS[currentFramework].name}
                                    <Icon name="chevronDown" />
                                </span>
                            </div>{' '}
                            <a href={ctaUrl} className={styles.learnMoreLink}>
                                {ctaTitle ? ctaTitle : 'Learn more'} <Icon name="chevronRight" />
                            </a>
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
                                    {Object.keys(FRAMEWORK_CONFIGS).map((framework) => {
                                        const FrameworkIcon = FRAMEWORK_CONFIGS[framework].Icon;
                                        const isCurrentFramework = framework === currentFramework;
                                        return (
                                            <div
                                                key={framework}
                                                className={`
                                                    ${styles.frameworkOption} 
                                                    ${isCurrentFramework ? styles.currentFramework : ''}
                                                `}
                                                onClick={() => !isCurrentFramework && handleFrameworkChange(framework)}
                                            >
                                                <FrameworkIcon />
                                                <span>{FRAMEWORK_CONFIGS[framework].name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {children}
        </div>
    );
};
