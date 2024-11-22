import { type ReactNode, useEffect, useState } from 'react';
import root from 'react-shadow';

export type ShadowDomProps = {
    children: ReactNode;
};

export const ShadowDom = ({ children }: ShadowDomProps) => {
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => setIsHydrated(true), []);

    return <>{isHydrated && <root.div style={{ height: '100%' }}>{children}</root.div>}</>;
};
