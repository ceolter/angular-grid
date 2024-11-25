import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classNames from 'classnames';

import styles from './Quotes.module.scss';
import type { QuotesData, QuotesDataItem } from './quotesData';

function filterAndSortByKey(data: QuotesData, sortKey: keyof QuotesDataItem) {
    return Object.values(data)
        .filter((d) => {
            const value = d[sortKey];
            return value !== undefined && value >= 0;
        })
        .sort((a, b) => {
            return a[sortKey]! - b[sortKey]!;
        });
}

const QuoteItems = ({ quotes }: { quotes: QuotesDataItem[] }) => {
    return (
        <>
            {quotes.map(({ name, avatarUrl, orgName, orgIconUrl, orgRole, text }) => {
                return (
                    <div className={styles.quote} key={name}>
                        <blockquote>
                            <p>{text}</p>
                        </blockquote>

                        <footer>
                            <img className={styles.avatar} src={urlWithBaseUrl(avatarUrl)} alt={name} />
                            <div>
                                <h4 className={classNames(styles.name, 'text-lg')}>{name}</h4>
                                <p className={classNames(styles.role, 'text-base')}>
                                    {orgRole} {orgName}
                                </p>
                            </div>
                            <img className={styles.orgIcon} src={urlWithPrefix({ url: orgIconUrl })} alt={orgName} />
                        </footer>
                    </div>
                );
            })}
        </>
    );
};

export const Quotes = ({ data }: { data: QuotesData }) => {
    const quotes = filterAndSortByKey(data, 'order');

    return (
        <ul className={classNames(styles.container, 'list-style-none')}>
            <QuoteItems quotes={quotes} />
        </ul>
    );
};
