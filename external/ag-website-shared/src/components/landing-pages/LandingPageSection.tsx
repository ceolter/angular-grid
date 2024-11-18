import classnames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './LandingPageSection.module.scss';

interface Props {
    tag: string;
    heading?: string;
    headingHtml?: string;
    subHeading: string;
    learnMoreUrl?: string;
    sectionClass?: string;
    children: ReactNode;
}

export const LandingPageSection: FunctionComponent<Props> = ({
    tag,
    heading,
    headingHtml,
    subHeading,
    learnMoreUrl,
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
                {learnMoreUrl && (
                    <a href={learnMoreUrl} className={classnames([styles.learnMoreButton, 'button-tertiary'])}>
                        Learn more
                    </a>
                )}
            </header>

            {children}
        </div>
    );
};
