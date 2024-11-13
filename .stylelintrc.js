module.exports = {
    extends: 'stylelint-config-standard',
    rules: {
        'comment-empty-line-before': [
            'always',
            {
                except: ['first-nested'],
                ignoreComments: ['/rtl:.*/'],
            },
        ],
        // NOTE: the intention here is that all our CSS rules have a single
        // class name in the selector that identifies the  component. Whenever
        // we need to target "the instance of a child component inside a parent"
        // use `:where(.ag-parent) .ag-child` to reduce the specificity.
        //
        // We allow state selectors like :focus and .ag-disabled on top of this,
        // because we want them to be slightly more specific. If for example a
        // component .ag-foo has a default color and a focus color, we want
        // `.ag-foo { color: black }` to set the default colour without also
        // removing the focus effect.
        'selector-max-specificity': [
            '0,1,0',
            {
                // add selectors here only if they refer to states, rather than components
                ignoreSelectors: [
                    '/^:/',
                    '[disabled]',
                    ':not(:disabled)',
                    '[readonly]',
                    '.ag-animating',
                    '.ag-disabled',
                    '.ag-selected',
                    '.ag-not-selected',
                    '.ag-checked',
                    '.ag-cell-inline-editing',
                    '.ag-row-hover',
                    '.ag-row-selected',
                    '.ag-picker-has-focus',
                    '.ag-sticky-label',
                    '.ag-header-cell-wrap-text',
                    '.ag-tab-selected',
                    '.ag-column-select-column-readonly',
                    '.ag-column-select-column-group-readonly',
                    '.ag-active-item',
                    '.ag-layout-print',
                    '.ag-layout-normal',
                    '.ag-layout-auto-height',
                ],
            },
        ],

        // NOTE: In general we want to avoid targeting grid elements using
        // [class^='ag-'] as customer applications can have elements with that
        // prefix too. Sometimes it is unavoidable, e.g. for global style
        // resets, in which case scope the selector so it is only applied within
        // the grid root.
        'selector-disallowed-list': [
            ['/.*class\\^=.*/'],
            {
                message:
                    'Avoid selectors that target partial classnames unless absolutely necessary - see note in .stylelintrc.js',
                severity: 'error',
            },
        ],
    },
};
