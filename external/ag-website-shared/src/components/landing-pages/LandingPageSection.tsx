import { Icon } from '@ag-website-shared/components/icon/Icon';
import AngularIcon from '@ag-website-shared/images/inline-svgs/angular.svg?react';
import JavascriptIcon from '@ag-website-shared/images/inline-svgs/javascript.svg?react';
import ReactIcon from '@ag-website-shared/images/inline-svgs/react.svg?react';
import VueIcon from '@ag-website-shared/images/inline-svgs/vue.svg?react';
import classnames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

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
    framework: boolean;
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
    framework,
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

                <div className={styles.frameworkGroup}>
                    {framework && (
                        <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                            {framework && <ReactIcon />} {ctaTitle ? ctaTitle : 'Learn more'}{' '}
                            <Icon name="chevronRight" />
                        </a>
                    )}

                    {framework && (
                        <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                            {framework && <AngularIcon />}
                        </a>
                    )}

                    {framework && (
                        <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                            {framework && <VueIcon />}
                        </a>
                    )}

                    {framework && (
                        <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                            {framework && <JavascriptIcon />}
                        </a>
                    )}
                </div>
            </header>

            {children}
        </div>
    );
};
