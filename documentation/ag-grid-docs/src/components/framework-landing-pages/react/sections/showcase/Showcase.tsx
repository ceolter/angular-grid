import { Icon } from '@ag-website-shared/components/icon/Icon';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import Aerie from 'public/community/showcase/aerie.svg?react';
import AIIcon from 'public/community/showcase/ai.svg?react';
import DashboardIcon from 'public/community/showcase/dashboard.svg?react';
import FinanceIcon from 'public/community/showcase/finance.svg?react';
import MLFlowLogo from 'public/community/showcase/mlflow.svg?react';
import ModelIcon from 'public/community/showcase/model.svg?react';
import OpenBB from 'public/community/showcase/openbb.svg?react';
import RA from 'public/community/showcase/ra.svg?react';
import TerminalIcon from 'public/community/showcase/terminal.svg?react';
import Windmill from 'public/community/showcase/windmill.svg?react';
import React from 'react';

import styles from './Showcase.module.scss';

const Showcase: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <FinanceIcon className={styles.icon} />
                    <OpenBB className={styles.logo} />
                </div>
                <h3 className={styles.title}>Finance</h3>
                <p className={styles.description}>
                    Analyse complex financial data, perform calculations and visualise the data in AG Grid, with
                    standalone charts from AG Charts.
                </p>
                <a
                    href="https://openbb.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Visit Site
                    </span>
                </a>
                <a
                    href="https://github.com/OpenBB-finance/OpenBBTerminal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Source code
                    </span>
                </a>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <AIIcon className={styles.icon} />
                    <MLFlowLogo className={styles.logo} />
                </div>
                <h3 className={styles.title}>ML/AI</h3>
                <p className={styles.description}>
                    Build models and generative AI apps on a unified, end-to-end, MLOps platform which uses AG Grid to
                    powers the tables in its dashboard
                </p>
                <a
                    href="https://mlflow.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Visit Site
                    </span>
                </a>
                <a
                    href="https://github.com/mlflow/mlflow/tree/master"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Source code
                    </span>
                </a>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <ModelIcon className={styles.icon} />
                    <Windmill className={styles.logo} />
                </div>
                <h3 className={styles.title}>Data Modelling</h3>
                <p className={styles.description}>
                    Planning, scheduling, and sequencing tools for modern space missions. AG Grid is used throughout to
                    help visualise mission data.
                </p>
                <a
                    href="https://www.windmill.dev/docs/apps/app_configuration_settings/aggrid_table#aggird-table-input"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Visit Site
                    </span>
                </a>
                <a
                    href="https://github.com/windmill-labs/windmill"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Source code
                    </span>
                </a>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <DashboardIcon className={styles.icon} />
                    <RA className={styles.logo} />
                </div>
                <h3 className={styles.title}>Dashboards</h3>
                <p className={styles.description}>
                    An open source React library for building dashboards, with AG Grid enterprise support for building
                    React tables with advanced features.
                </p>
                <a
                    href="https://marmelab.com/react-admin/DatagridAG.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Visit Site
                    </span>
                </a>
                <a
                    href="https://github.com/marmelab/react-admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Source code
                    </span>
                </a>
            </div>

            <div className={styles.gridItem}>
                <div className={styles.iconWrapper}>
                    <TerminalIcon className={styles.icon} />
                    <Aerie className={styles.logo} />
                </div>
                <h3 className={styles.title}>Developer Platforms</h3>
                <p className={styles.description}>
                    Open-source developer platforms and workflow engines who use AG Grid as part of their drag & drop UI
                    builder.
                </p>
                <a
                    href="https://nasa-ammos.github.io/aerie-docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Visit Site
                    </span>
                </a>
                <a
                    href="https://github.com/NASA-AMMOS/aerie-ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300"
                >
                    <span className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        Source code
                    </span>
                </a>
            </div>
        </div>
    );
};

export default Showcase;
