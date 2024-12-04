import type { Framework } from '@ag-grid-types';
import { Collapsible } from '@ag-website-shared/components/collapsible/Collapsible';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { useFrameworkSelector } from '@ag-website-shared/utils/useFrameworkSelector';
import { transformMarkdoc } from '@utils/markdoc/transformMarkdoc';
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
    framework: Framework;
}

const FAQItem: FunctionComponent<FAQItemData> = ({ itemData, isOpen, onClick }) => {
    const { framework } = useFrameworkSelector();
    const { MarkdocContent } = transformMarkdoc({ framework, markdocContent: itemData.answer });

    return (
        <div className={classnames(styles.questionContainer, 'plausible-event-name=react-table-expand-faq')}>
            <div className={styles.titleContainer} onClick={onClick}>
                <span className={styles.question}>{itemData.question}</span>
                <Icon svgClasses={classnames(styles.expandIcon, { [styles.iconDown]: isOpen })} name={'chevronRight'} />
            </div>

            <Collapsible isOpen={isOpen}>
                <div className={styles.answerContainer}>
                    <MarkdocContent />
                </div>
            </Collapsible>
        </div>
    );
};

export const LandingPageFAQ: FunctionComponent<Props> = ({ FAQData }) => {
    const [activeItemIndex, setActiveItemIndex] = useState(-1);

    const clickHandler = (activeIndex) => {
        setActiveItemIndex(activeIndex !== activeItemIndex ? activeIndex : -1);
    };

    const getColumnItems = (columnIndex) => {
        return FAQData.map((item, i) => {
            if (i % 2 !== columnIndex) return;

            return (
                <FAQItem
                    itemData={item}
                    key={i}
                    isOpen={activeItemIndex === i}
                    onClick={() => {
                        clickHandler(i);
                    }}
                />
            );
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.column}> {getColumnItems(0)}</div>
            <div className={styles.column}> {getColumnItems(1)}</div>
        </div>
    );
};
