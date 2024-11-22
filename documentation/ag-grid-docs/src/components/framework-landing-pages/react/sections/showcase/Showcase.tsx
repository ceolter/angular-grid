import React from 'react';

import styles from './Showcase.module.scss';
import Aerie from './images/aerie.svg?react';
import AIIcon from './images/ai.svg?react';
import DashboardIcon from './images/dashboard.svg?react';
import FinanceIcon from './images/finance.svg?react';
import MLFlowLogo from './images/mlflow.svg?react';
import ModelIcon from './images/model.svg?react';
import OpenBB from './images/openbb.svg?react';
import RA from './images/ra.svg?react';
import TerminalIcon from './images/terminal.svg?react';
import Windmill from './images/windmill.svg?react';

const SHOWCASE_ITEMS = [
    {
        title: 'Finance',
        titleIcon: <FinanceIcon />,
        description:
            'Analyse complex financial data, perform calculations and visualise the data in AG Grid, with standalone charts from AG Charts.',
        projectLogo: <OpenBB />,
        projectHref: 'https://openbb.co/',
        sourceHref: 'https://github.com/OpenBB-finance/OpenBBTerminal',
    },
    {
        title: 'ML/AI',
        titleIcon: <AIIcon />,
        description:
            'Build models and generative AI apps on a unified, end-to-end, MLOps platform which uses AG Grid to powers the tables in its dashboard',
        projectLogo: <MLFlowLogo />,
        projectHref: 'https://mlflow.org',
        sourceHref: 'https://github.com/mlflow/mlflow/tree/master',
    },
    {
        title: 'Data Modelling',
        titleIcon: <ModelIcon />,
        description:
            'Planning, scheduling, and sequencing tools for modern space missions. AG Grid is used throughout to help visualise mission data.',
        projectLogo: <Windmill />,
        projectHref: 'https://www.windmill.dev/docs/apps/app_configuration_settings/aggrid_table#aggird-table-input',
        sourceHref: 'https://github.com/windmill-labs/windmill',
    },
    {
        title: 'Dashboards',
        titleIcon: <DashboardIcon />,
        description:
            'An open source React library for building dashboards, with AG Grid enterprise support for building React tables with advanced features.',
        projectLogo: <RA />,
        projectHref: 'https://marmelab.com/react-admin/DatagridAG.html',
        sourceHref: 'https://github.com/marmelab/react-admin',
    },
    {
        title: 'Developer Platforms',
        titleIcon: <TerminalIcon />,
        description:
            'Open-source developer platforms and workflow engines who use AG Grid as part of their drag & drop UI builder.',
        projectLogo: <Aerie />,
        projectHref: 'https://nasa-ammos.github.io/aerie-docs/',
        sourceHref: 'https://github.com/NASA-AMMOS/aerie-ui',
    },
];

const ShowcaseItem: React.FC = ({ title, titleIcon, description, projectLogo, projectHref, sourceHref }) => {
    return (
        <div className={styles.showcaseGridItem}>
            <div className={styles.showcaseIconWrapper}>
                <span className={styles.showcaseIcon}>{titleIcon}</span>
                <span className={styles.showcaseLogo}>{projectLogo}</span>
            </div>
            <h3 className={styles.showcaseTitle}>{title}</h3>
            <p className={styles.showcaseDescription}>{description}</p>
            <div className={styles.showcaseLinksWrapper}>
                <a href={projectHref} target="_blank" rel="noopener noreferrer">
                    Visit Site
                </a>{' '}
                <a href={sourceHref} target="_blank" rel="noopener noreferrer">
                    Source code
                </a>
            </div>
        </div>
    );
};

const Showcase: React.FC = () => {
    return (
        <div className={styles.showcaseContainer}>
            {SHOWCASE_ITEMS.map((showcaseItem) => {
                return <ShowcaseItem key={showcaseItem.title} {...showcaseItem} />;
            })}
        </div>
    );
};

export default Showcase;
