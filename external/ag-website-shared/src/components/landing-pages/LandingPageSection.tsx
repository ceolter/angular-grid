import { Icon } from '@ag-website-shared/components/icon/Icon';
import AngularIcon from '@ag-website-shared/images/inline-svgs/angular.svg?react';
import JavascriptIcon from '@ag-website-shared/images/inline-svgs/javascript.svg?react';
import ReactIcon from '@ag-website-shared/images/inline-svgs/react.svg?react';
import VueIcon from '@ag-website-shared/images/inline-svgs/vue.svg?react';
import { gridUrlWithPrefix } from '@ag-website-shared/utils/gridUrlWithPrefix';
import { setInternalFramework } from '@stores/frameworkStore';
import { useFrameworkFromStore } from '@utils/hooks/useFrameworkFromStore';
import classnames from 'classnames';
import { useRef, useState } from 'react';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

const CTA_TITLE_FRAMEWORK_STRING = '${framework}';

const FRAMEWORK_CONFIGS = {
    react: {
        Icon: ReactIcon,
        name: 'React',
    },
    angular: {
        Icon: AngularIcon,
        name: 'Angular',
    },
    vue3: {
        Icon: VueIcon,
        name: 'Vue',
    },
    vanilla: {
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

const CTAWithFrameworks: FunctionComponent<Props> = ({ ctaTitle, ctaUrl }) => {
    const framework = useFrameworkFromStore(); // Get the framework from the store
    const [isHovering, setIsHovering] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const frameworkContainerRef = useRef<HTMLDivElement>(null);
    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

    const mapFrameworkToInternalFramework = (framework: string) => {
        switch (framework) {
            case 'javascript':
                return 'vanilla';
            case 'vue':
                return 'vue3';
            default:
                return framework;
        }
    };

    const internalFrameworkKey = mapFrameworkToInternalFramework(framework);
    const CurrentIcon = FRAMEWORK_CONFIGS[internalFrameworkKey]?.Icon;

    const handleFrameworkChange = (newFramework: string) => {
        const internalFrameworkKey = mapFrameworkToInternalFramework(newFramework);

        setInternalFramework(internalFrameworkKey); // Update the store with the correct internal framework
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
        <a
            href={gridUrlWithPrefix({ framework, url: ctaUrl })}
            className={classnames([styles.CTAWithFrameworks, 'button-tertiary'])}
        >
            <span>{ctaTitle.split(CTA_TITLE_FRAMEWORK_STRING)[0]}</span>

            <div
                ref={frameworkContainerRef}
                className={styles.inlineSelectorContainer}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className={styles.frameworkSelectorInline}
                    onClick={(event) => {
                        event.preventDefault();
                    }}
                >
                    <CurrentIcon className={styles.frameworkIcon} />

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
                            const isCurrentFramework = frameworkKey === internalFrameworkKey;
                            return (
                                <div
                                    key={frameworkKey}
                                    className={classnames(styles.frameworkOption, {
                                        [styles.currentFramework]: isCurrentFramework,
                                    })}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        handleFrameworkChange(frameworkKey);
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

            <span>
                {ctaTitle.split(CTA_TITLE_FRAMEWORK_STRING)[1]}

                <Icon name="chevronRight" svgClasses={styles.frameworkChevronRight} />
            </span>
        </a>
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
    sectionClass,
    showBackgroundGradient,
    children,
}) => {
    const isFramework = ctaTitle.includes(CTA_TITLE_FRAMEWORK_STRING);

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
