import type { Framework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import AngularIcon from '@ag-website-shared/images/inline-svgs/angular.svg?react';
import JavascriptIcon from '@ag-website-shared/images/inline-svgs/javascript.svg?react';
import ReactIcon from '@ag-website-shared/images/inline-svgs/react.svg?react';
import VueIcon from '@ag-website-shared/images/inline-svgs/vue.svg?react';
import { gridUrlWithPrefix } from '@ag-website-shared/utils/gridUrlWithPrefix';
import { useFrameworkSelector } from '@ag-website-shared/utils/useFrameworkSelector';
import classnames from 'classnames';
import { useRef, useState } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

const FRAMEWORK_CONFIGS: Record<Framework, { Icon: any; name: string }> = {
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
    isFramework?: boolean;
}

const CTAWithFrameworks: FunctionComponent<{ ctaTitle: string; ctaUrl: string }> = ({ ctaTitle, ctaUrl }) => {
    const { framework, internalFramework, handleFrameworkChange } = useFrameworkSelector();
    const [isHovering, setIsHovering] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const frameworkContainerRef = useRef<HTMLDivElement>(null);
    const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const CurrentIcon = FRAMEWORK_CONFIGS[framework]?.Icon;

    const handleFrameworkSelection = (newFramework: string) => {
        handleFrameworkChange(newFramework);
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

    return (
        <div className={styles.CTAWithFrameworks}>
            <a
                href={gridUrlWithPrefix({ framework, url: ctaUrl })}
                className={classnames([styles.ctaButton, 'button-tertiary'])}
            >
                {ctaTitle}
                <Icon name="chevronRight" />
            </a>

            <div
                ref={frameworkContainerRef}
                className={classnames([styles.inlineSelectorContainer, 'button-tertiary'])}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className={styles.frameworkSelectorInline}
                    onClick={(event) => {
                        event.preventDefault();
                    }}
                >
                    {CurrentIcon && <CurrentIcon className={styles.frameworkIcon} />}

                    <span className={styles.frameworkName}>{framework}</span>

                    <Icon name="chevronDown" svgClasses={styles.frameworkChevronDown} />
                </div>

                {isHovering && (
                    <div
                        className={classnames(styles.frameworkOverlay, {
                            [styles.hiding]: isHiding,
                            [styles.visible]: !isHiding,
                        })}
                        onMouseEnter={() => {
                            if (overlayTimerRef.current) {
                                clearTimeout(overlayTimerRef.current);
                            }
                            setIsHiding(false);
                        }}
                        onMouseLeave={handleMouseLeave}
                    >
                        {Object.keys(FRAMEWORK_CONFIGS).map((frameworkKey) => {
                            const FrameworkIcon = FRAMEWORK_CONFIGS[frameworkKey].Icon;
                            const isCurrentFramework = frameworkKey === internalFramework;
                            return (
                                <div
                                    key={frameworkKey}
                                    className={classnames(styles.frameworkOption, {
                                        [styles.currentFramework]: isCurrentFramework,
                                    })}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        handleFrameworkSelection(frameworkKey);
                                    }}
                                >
                                    <FrameworkIcon />
                                    <span>{FRAMEWORK_CONFIGS[frameworkKey].name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const LandingPageSection: FunctionComponent<Props> = ({
    tag,
    heading,
    headingHtml,
    subHeading,
    subHeadingHtml,
    ctaTitle = 'Learn more',
    ctaUrl,
    isFramework = false,
    sectionClass,
    showBackgroundGradient,
    children,
}) => {
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

                {ctaUrl && isFramework && <CTAWithFrameworks ctaTitle={ctaTitle} ctaUrl={ctaUrl} />}

                {ctaUrl && !isFramework && (
                    <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                        {ctaTitle} <Icon name="chevronRight" />
                    </a>
                )}
            </header>

            {children}
        </div>
    );
};
