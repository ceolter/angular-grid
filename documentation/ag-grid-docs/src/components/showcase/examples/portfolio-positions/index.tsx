import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import PortfolioExample from './components/portfolio-example/PortfolioExample';
import './index.module.css';

interface Props {}

export const PortfolioPositions: FunctionComponent<Props> = () => {
    const [isDarkMode] = useDarkmode();

    return <PortfolioExample isDarkMode={isDarkMode} />;
};
