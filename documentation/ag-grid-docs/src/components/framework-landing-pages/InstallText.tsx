import { Icon } from '@ag-website-shared/components/icon/Icon';
import { useRef, useState } from 'react';

import styles from './InstallText.module.scss';

const InstallText = () => {
    const [isCopied, setIsCopied] = useState(false);
    const installTextRef = useRef(null);
    const copyToClipboard = () => {
        const text = installTextRef?.current?.innerText?.replace('$', '');
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <>
            <div>
                <span ref={installTextRef} className={styles.installText}>
                    $ npm install ag-grid-react
                </span>
                <span className={`plausible-event-name=react-table-copy-cta`} onClick={copyToClipboard}>
                    <Icon svgClasses={styles.copyToClipboardIcon} name={isCopied ? 'tick' : 'copy'} />
                </span>
            </div>
        </>
    );
};

export default InstallText;
