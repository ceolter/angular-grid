import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import { FinanceExample, type Props } from './FinanceExample';

export const Finance: FunctionComponent = (params: Omit<Props, 'isDarkMode'>) => {
    const [isDarkMode] = useDarkmode();

    return <FinanceExample isDarkMode={isDarkMode} {...params} />;
};
