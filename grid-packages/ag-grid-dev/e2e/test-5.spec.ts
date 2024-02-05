import { test, expect } from '@playwright/test';
import { goToAndWaitForData, getCellLocator, getCellLocatorBy } from './utils';
import exp = require('constants');

test('test', async ({ page }) => {
    await goToAndWaitForData(
        page,
        'https://grid-staging.ag-grid.com/examples/value-formatters/value-formatters/modules/typescript/index.html'
    );

    const colCell = getCellLocator(page, 'a', 0);
    expect(await colCell.textContent()).toBe('6912');

    expect(await getCellLocator(page, 'b', 1).textContent()).toBe('7648');
    expect(await getCellLocator(page, 'a_1', 1).textContent()).toBe('£368');
    
    
    const cc = await getCellLocatorBy(page, {
      colHeaderName: '£A',
      rowIndex: 1
    })
    expect(await cc.textContent()).toBe('£368');
});
