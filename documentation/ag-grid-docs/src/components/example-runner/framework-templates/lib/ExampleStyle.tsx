const css = String.raw;

/**
 * These are the CSS styles shared by all examples.
 */
export const ExampleStyle = ({ rootSelector, extraStyles }: { rootSelector?: string; extraStyles?: string }) => {
    const styles = css`
        :root,
        body${rootSelector ? `, ${rootSelector}` : ''} {
            height: 100%;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
        }

        html {
            position: absolute;
            top: 0;
            left: 0;
            padding: 0;
            overflow: auto;
            font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
                'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                'Noto Color Emoji';
        }

        body {
            padding: 16px;
            overflow: auto;
            background-color: transparent;
        }

        ${extraStyles ? extraStyles : ''}
    `;

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&amp;display=swap"
                rel="stylesheet"
            />
            <style media="only screen" dangerouslySetInnerHTML={{ __html: styles }}></style>
        </>
    );
};
