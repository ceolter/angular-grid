import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import { FinanceExample } from './FinanceExample';

export const Finance: FunctionComponent = ({ gridHeight, isSmallerGrid }) => {
    const [isDarkMode] = useDarkmode();

    return <FinanceExample isDarkMode={isDarkMode} gridHeight={gridHeight} isSmallerGrid={isSmallerGrid} />;
};
