import { type FunctionComponent } from 'react';

import PortfolioExample from './components/portfolio-example/PortfolioExample';
import './index.module.css';

interface Props {}

export const PortfolioPositions: FunctionComponent<Props> = () => {
    return <PortfolioExample />;
};
