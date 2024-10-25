import type { DetailGridInfo, IDetailGridApiService, NamedBean } from 'ag-grid-community';
import { BeanStub, _exists } from 'ag-grid-community';

export class DetailGridApiService extends BeanStub implements NamedBean, IDetailGridApiService {
    beanName = 'detailGridApiSvc' as const;

    private detailGridInfoMap: { [id: string]: DetailGridInfo | undefined } = {};

    public addDetailGridInfo(id: string, gridInfo: DetailGridInfo): void {
        this.detailGridInfoMap[id] = gridInfo;
    }

    public removeDetailGridInfo(id: string): void {
        delete this.detailGridInfoMap[id];
    }

    public getDetailGridInfo(id: string): DetailGridInfo | undefined {
        return this.detailGridInfoMap[id];
    }

    public forEachDetailGridInfo(callback: (gridInfo: DetailGridInfo, index: number) => void) {
        let index = 0;
        Object.values(this.detailGridInfoMap).forEach((gridInfo: DetailGridInfo) => {
            // check for undefined, as old references will still be lying around
            if (_exists(gridInfo)) {
                callback(gridInfo, index);
                index++;
            }
        });
    }

    public override destroy(): void {
        this.detailGridInfoMap = {};
        super.destroy();
    }
}
