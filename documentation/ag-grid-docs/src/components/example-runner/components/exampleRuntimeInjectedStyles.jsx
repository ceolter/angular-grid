/**
 * These styles are injected at runtime if the example is running on the
 * website. Use them for making website-specific tweaks that we don't want to
 * show to users who view the code or run the example on CodeSandbox.
 */
export default /* css */ `

body {
    padding: 0;
}

/* This should be refactored and fixed at the place where .test-header is defined */
.test-header {
    margin-bottom: 0 !important;
}

html, body {
    background-color: transparent;
}

/* Apply "color-scheme: dark;" to all elements outside the grid */ 
html[data-color-scheme='dark'] body > *:where(:not([class^=ag])) {
    color-scheme: dark;
}

html[data-color-scheme='dark'] button:not(.ag-root-wrapper button, #myChart button, button[class*='ag-']) , .ag-fill-direction  {
    border: 1px solid rgba(255,255,255, 0.2);
}

html button:not(.ag-root-wrapper button, .ag-chart button, button[class*='ag-']), .ag-fill-direction  {
    appearance: none;
    background-color: var(--background-100);
    border: 1px solid rgba(0,0,0, 0.2);
    border-radius: 6px;
    height: 36px;
    color: var(--default-text-color);
    cursor: pointer;
    display: inline-block;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: .01em;
    padding: 0.375em 1em 0.4em;
    white-space: nowrap;
    margin-right: 6px;
    margin-bottom: 8px;
    transition: background-color .25s ease-in-out;
}

html[data-color-scheme='dark'] button:not(.ag-root-wrapper button, .ag-chart button, button[class*='ag-']):hover {
    background-color: #2a343e;
}

html button:not(.ag-root-wrapper button, .ag-chart button, button[class*='ag-']):hover {
    background-color: rgba(0,0,0, 0.1);
}

html[data-color-scheme='light'] select:not(.ag-root-wrapper select, .ag-chart select, select[class*='ag-']),
html[data-color-scheme='dark'] select:not(.ag-root-wrapper select, .ag-chart select, select[class*='ag-']) {
    appearance: none;
    height: 36px;
    min-width: 36px;
    padding: 6px 36px 6px 12px;
    border-radius: 4px;
    background-repeat: no-repeat;
    background-position: center right 4px;
    transition: background-color .25s ease-in-out;
    cursor: pointer;
}

html[data-color-scheme='dark'] select:not(.ag-root-wrapper select, .ag-chart select, select[class*='ag-']) {
    background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 9L12 15L18 9"/></svg>');
    background-color: #202A34;
    border: 1px solid rgb(255,255,255,0.1);
}

html[data-color-scheme='light'] select:not(.ag-root-wrapper select, .ag-chart select, select[class*='ag-']) {
    background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23182230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 9L12 15L18 9"/></svg>');
    background-color: #fff;
    border: 1px solid rgb(0,0,0,0.1);
}

html label input:not(.ag-root-wrapper input):not(.ag-chart input):not([class*='ag-']):not([type='checkbox']):not([type='radio']):not(.flatpickr-calendar input),
html label + input:not(.ag-root-wrapper input):not(.ag-chart input):not([class*='ag-']):not([type='checkbox']):not([type='radio']):not(.flatpickr-calendar input) {
    margin-left: 8px;
}

html[data-color-scheme='dark'] input:not(.ag-root-wrapper input):not(.ag-chart input):not([class*='ag-']):not([type='checkbox']):not([type='radio']):not(.flatpickr-calendar input) {
    appearance: none;
    background-color: #202A34;
    border: 1px solid rgb(255,255,255,0.1);
    border-radius: 4px;
    height: 36px;
    min-width: 36px;
}

html[data-color-scheme='light'] input:not(.ag-root-wrapper input):not(.ag-chart input):not([class*='ag-']):not([type='checkbox']):not([type='radio']):not(.flatpickr-calendar input) {
    appearance: none;
    background-color: #fff;
    border: 1px solid rgb(0,0,0,0.1);
    border-radius: 4px;
    height: 36px;
    min-width: 36px;
}

html[data-color-scheme='dark'] body {
  color: #fff;
}

html textarea {
  padding: 8px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 8px;
  color: #0c111d;
  border: 1px solid rgba(0,0,0, 0.2);
}

html[data-color-scheme='dark'] textarea {
  border: 1px solid rgba(255,255,255, 0.2);
  background-color: #0c111d;
  color: #fff;
}

html[data-color-scheme='dark'] textarea::placeholder {
  color: #98a2b3;
}

#myChart, .my-chart {
    margin-top: 8px;
    margin-bottom: 8px;
    border-radius: 8px;
    border: 1px solid var(--ag-border-color);
}

#myChart .ag-chart,
.my-chart .ag-chart {
    border-radius: 8px;
}

#top .my-chart {
    margin-top: 0;
}

#top .my-chart {
    margin-bottom: 0;
}

#top .my-chart:first-child {
    margin-right: 8px;
}
`;
