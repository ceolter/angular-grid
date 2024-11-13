import { useDarkmode } from '@utils/hooks/useDarkmode';
import { useIntersectionObserver } from '@utils/hooks/useIntersectionObserver';
import classnames from 'classnames';
import { type FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import styles from './ExampleIFrame.module.scss';
import exampleRuntimeInjectedStyles from './exampleRuntimeInjectedStyles';

interface Props {
    title: string;
    isHidden?: boolean;
    url?: string;
    loadingIFrameId: string;
    suppressDarkMode?: boolean;
}

export const ExampleIFrame: FunctionComponent<Props> = ({
    title,
    isHidden,
    url,
    loadingIFrameId,
    suppressDarkMode,
}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const iFrameRef = useRef<HTMLIFrameElement>(null);
    const [darkMode] = useDarkmode();
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const scrollListener = () => {
            setIsScrolling(true);
            // Ensure a slow user scroll still loads the example
            // Main idea is to prevent loading examples during smooth scroll behavior of right menu links
            setTimeout(() => {
                setIsScrolling(false);
            }, 500);
        };
        const scrollEndListener = () => setIsScrolling(false);

        addEventListener('scrollend', scrollEndListener);
        addEventListener('scroll', scrollListener);

        return () => {
            removeEventListener('scroll', scrollListener);
            removeEventListener('scrollend', scrollEndListener);
        };
    }, []);

    // Only show example iFrame if it is visible on the screen
    useIntersectionObserver({
        elementRef: iFrameRef,
        onChange: ({ isIntersecting: newIsIntersecting }) => {
            setIsIntersecting(newIsIntersecting);
        },
    });

    useEffect(() => {
        const currentSrc = iFrameRef.current?.src && new URL(iFrameRef.current.src);
        if (!isIntersecting || !url || !iFrameRef.current || (currentSrc as URL)?.pathname === url || isScrolling) {
            return;
        }
        iFrameRef.current.src = url;
    }, [isIntersecting, url, isScrolling]);

    // when dark mode is changed, applies it to the iframe.
    useEffect(() => {
        if (!iFrameRef.current) {
            return;
        }
        applyExampleStyleChanges(iFrameRef.current.contentDocument!, suppressDarkMode ? null : darkMode);
    }, [darkMode, suppressDarkMode]);

    const handleOnLoad = useCallback(() => {
        if (!iFrameRef.current) {
            return;
        }
        applyExampleStyleChanges(iFrameRef.current.contentDocument!, suppressDarkMode ? null : darkMode);
    }, [darkMode, suppressDarkMode]);

    return (
        <div
            className={classnames(styles.container, {
                [styles.hidden]: isHidden,
            })}
        >
            {/*`exampleRunner` class is used by the dark mode toggle to post a message to this iFrame*/}
            <iframe
                id={loadingIFrameId}
                title={title}
                ref={iFrameRef}
                className={classnames('exampleRunner', styles.iframe)}
                style={{ visibility: 'hidden' }}
                onLoad={handleOnLoad}
            />
        </div>
    );
};

const applyExampleStyleChanges = (document: Document, darkMode: boolean | null) => {
    if (darkMode != null) {
        document.documentElement.dataset.colorScheme = darkMode ? 'dark' : 'light';
        document.documentElement.dataset.agThemeMode = darkMode ? 'dark-blue' : 'light';
    }
    injectStylesheet(document);

    // dispatch 'color-scheme-change' event for Integrated Charts to update dark mode theme
    document.dispatchEvent(new CustomEvent('color-scheme-change', { detail: { darkMode } }));
};

const injectStylesheet = (document: Document) => {
    const id = 'example-runner-injected-styles';
    let style = document.body.querySelector(`#${id}`);
    if (!style) {
        style = document.createElement('style');
        style.setAttribute('id', id);
        document.body.insertBefore(style, document.body.firstChild);
    }
    style.textContent = exampleRuntimeInjectedStyles;
};
