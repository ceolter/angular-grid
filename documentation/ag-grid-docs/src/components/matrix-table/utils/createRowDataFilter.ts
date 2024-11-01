/**
 * Compile a filter string into a row data `filter` function
 *
 * NOTE: Only supports simple field key matches, `!key`, `&&` and `||` cases
 */
export function createRowDataFilter(filter: string) {
    const tokens = filter.split(/\s+/);

    return (datum) => {
        let isFiltered = true;
        let prevOperandIsAnd = true;

        tokens.forEach((token) => {
            if (token === '||') {
                prevOperandIsAnd = false;
                return;
            } else if (token === '&&') {
                prevOperandIsAnd = true;
                return;
            }

            const negate = token.startsWith('!');
            const fieldName = negate ? token.slice(1) : token;
            const value = Boolean(datum[fieldName]);
            const resolvedValue = negate ? !value : value;

            if (prevOperandIsAnd) {
                isFiltered = isFiltered && resolvedValue;
            } else {
                isFiltered = isFiltered || resolvedValue;
            }
        });

        return isFiltered;
    };
}
