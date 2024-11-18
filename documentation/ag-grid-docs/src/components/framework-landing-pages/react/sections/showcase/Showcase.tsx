import { Icon } from '@ag-website-shared/components/icon/Icon';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import AIIcon from 'public/community/showcase/ai.svg?react';
import DashboardIcon from 'public/community/showcase/dashboard.svg?react';
import FinanceIcon from 'public/community/showcase/finance.svg?react';
import ModelIcon from 'public/community/showcase/model.svg?react';
import TerminalIcon from 'public/community/showcase/terminal.svg?react';
import React from 'react';

import styles from './Showcase.module.scss';

const Showcase: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <FinanceIcon className={styles.icon} />
                </div>
                <h3 className={styles.title}>Finance</h3>
                <p className={styles.description}>
                    Analyse complex financial data, perform calculations and visualise the data in AG Grid, with
                    standalone charts from AG Charts.
                </p>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <AIIcon className={styles.icon} />
                </div>
                <h3 className={styles.title}>ML/AI</h3>
                <p className={styles.description}>
                    Build models and generative AI apps on a unified, end-to-end, MLOps platform which uses AG Grid to
                    powers the tables in its dashboard
                </p>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <ModelIcon className={styles.icon} />
                </div>
                <h3 className={styles.title}>Data Modelling</h3>
                <p className={styles.description}>
                    Planning, scheduling, and sequencing tools for modern space missions. AG Grid is used throughout to
                    help visualise mission data.
                </p>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <DashboardIcon className={styles.icon} />
                </div>
                <h3 className={styles.title}>Dashboards</h3>
                <p className={styles.description}>
                    An open source React library for building dashboards, with AG Grid enterprise support for building
                    React tables with advanced features.
                </p>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <TerminalIcon className={styles.icon} />
                </div>
                <h3 className={styles.title}>Developer Platforms</h3>
                <p className={styles.description}>
                    Open-source developer platforms and workflow engines who use AG Grid as part of their drag & drop UI
                    builder.
                </p>
            </div>
        </div>
    );
};

export default Showcase;
