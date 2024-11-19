import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import { useState } from 'react';
import type { FunctionComponent } from 'react';

import styles from './LandingPageFAQ.module.scss';

interface FAQItemData {
    question: string;
    answer: string;
}

interface Props {
    FAQData: FAQItemData[];
}

const FAQItem: FunctionComponent<FAQItemData> = ({ itemData, isOpen, onClick }) => {
    return (
        <div
            className={classnames(styles.questionContainer, 'plausible-event-name=react-table-expand-faq')}
            onClick={onClick}
        >
            <div className={styles.titleContainer}>
                <span className={styles.question}>{itemData.question}</span>
                <Icon svgClasses={styles.expandIcon} name={'chevronRight'} />
            </div>

            {isOpen && <div className={styles.answerContainer}>{itemData.answer}</div>}
        </div>
    );
};

export const LandingPageFAQ: FunctionComponent<Props> = ({ FAQData }) => {
    const [activeItemIndex, setActiveItemIndex] = useState(-1);

    return (
        <div className={styles.container}>
            {FAQData.map((item, i) => {
                return (
                    <FAQItem
                        itemData={item}
                        key={i}
                        isOpen={activeItemIndex === i}
                        onClick={() => {
                            setActiveItemIndex(i);
                        }}
                    />
                );
            })}
        </div>
    );
};
