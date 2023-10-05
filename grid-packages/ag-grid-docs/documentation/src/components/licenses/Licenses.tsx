import classnames from 'classnames';
import React, { FunctionComponent } from 'react';
import { Icon } from '../../components/Icon';
import { trackBuyButton } from '../../utils/analytics';
import AGGridLogo from '../../images/inline-svgs/ag-grid-logo.svg';
import AGChartsLogo from '../../images/inline-svgs/ag-charts-logo.svg';

// @ts-ignore
import styles from './Licenses.module.scss';

type LicenseData = {
    className: string;
    id: string;
    subHeading: string;
    licenseBenefits: string[];
    priceFullDollars: string;
    buyLink: string;
    Logo: any;
};

const DEV_LICENSE_DATA: LicenseData[] = [
    {
        className: styles.gridLicense,
        id: 'single-application',
        subHeading: 'AG Grid Enterprise',
        priceFullDollars: '999',
        licenseBenefits: ['Perpetual license', '1 year of support', '1 year of updates'],
        buyLink: '/ecommerce/#/ecommerce/?licenseType=single',
        Logo: AGGridLogo
    },
    {
        className: styles.chartsLicense,
        id: 'single-application',
        subHeading: 'AG Charts Enterprise',
        licenseBenefits: ['Perpetual license', '1 year of support', '1 year of updates'],
        priceFullDollars: '299',
        buyLink: '/ecommerce/#/ecommerce/?licenseType=multi',
        Logo: AGChartsLogo
    },
];

const makeNonBreaking = (text: string) => {
    const nonBreakingSpace = '\u00A0';

    return text.replace(' ', nonBreakingSpace);
};

const Price = ({ priceFullDollars }) => {
    return (
        <div className={styles.price}>
            <p className="font-size-small"><b>Starting at...</b></p>
            <p className={styles.priceFullDollars}>{priceFullDollars}</p>
            <p className="font-size-small">
                <b>Per Developer</b>
            </p>
        </div>
    );
};

const License = (props: LicenseData) => {
    const { id, subHeading, licenseBenefits, priceFullDollars, buyLink, Logo } = props;

    return (
        <>
            <div className={classnames(styles.top, 'top')}>
                <div className={styles.licenseMeta}>
                    <Logo className={styles.logo}/>
                    <p className="font-size-small text-secondary">{subHeading}<Icon name="enterprise" /></p>
                </div>

                <Price priceFullDollars={priceFullDollars} />

                <div className={styles.licenseBenefits}>
                    <ul className="font-size-small list-style-none">
                        {licenseBenefits.map((benefit, i) => {
                            return <li key={i}>{makeNonBreaking(benefit)}</li>;
                        })}
                    </ul>

                    <a className={classnames(styles.learnMoreLink, 'font-size-small')} href={`#${id}`}>
                        Learn more
                    </a>
                </div>

                <div className={styles.licenseActions}>
                    <a
                        className="button"
                        href={buyLink}
                        onClick={() => {
                            trackBuyButton({
                                type: id,
                            });
                        }}
                    >
                        Configure now
                    </a>
                </div>
            </div>
        </>
    );
};

export const Licenses: FunctionComponent = () => {
    return (
        <>
            {DEV_LICENSE_DATA.map((data) => {
                return (
                    <div key={data.name} className={classnames(styles.license, data.className, 'card')}>
                        <License {...data} />
                    </div>
                );
            })}
        </>
    );
};
