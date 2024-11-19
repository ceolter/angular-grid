import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

interface Props {
    tag: string;
    heading?: string;
    headingHtml?: string;
    subHeading: string;
    learnMoreTitle?: string;
    ctaTitle?: string;
    ctaUrl?: string;
    sectionClass?: string;
    children: ReactNode;
}

export const LandingPageSection: FunctionComponent<Props> = ({
    tag,
    heading,
    headingHtml,
    subHeading,
    ctaTitle,
    ctaUrl,
    sectionClass,
    children,
}) => {
    return (
        <div className={classnames(styles.sectionContent, sectionClass)}>
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

                <h4 className={styles.subHeading}>{subHeading}</h4>

                {ctaUrl && (
                    <a href={ctaUrl} className={classnames([styles.ctaButton, 'button-tertiary'])}>
                        {ctaTitle ? ctaTitle : 'Learn more'} <Icon name="chevronRight" />
                    </a>
                )}
            </header>

            {children}
        </div>
    );
};
