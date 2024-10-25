import type { ExcelColumn, ExcelOOXMLTemplate } from 'ag-grid-community';

// https://docs.microsoft.com/en-us/office/troubleshoot/excel/determine-column-widths
const getExcelCellWidth = (width: number): number => Math.ceil((width - 12) / 7 + 1);

const colFactory: ExcelOOXMLTemplate = {
    getTemplate(config: ExcelColumn) {
        const { min, max, outlineLevel, s, width, hidden, bestFit } = config;
        let excelWidth = 1;
        let customWidth = '0';

        if (width! > 1) {
            excelWidth = getExcelCellWidth(width!);
            customWidth = '1';
        }

        return {
            name: 'col',
            properties: {
                rawMap: {
                    min: min,
                    max: max,
                    outlineLevel: outlineLevel != null ? outlineLevel : undefined,
                    width: excelWidth,
                    style: s,
                    hidden: hidden ? '1' : '0',
                    bestFit: bestFit ? '1' : '0',
                    customWidth: customWidth,
                },
            },
        };
    },
};

export default colFactory;
