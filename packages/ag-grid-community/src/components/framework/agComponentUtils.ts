import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { IComponent } from '../../interfaces/iComponent';
import type { ComponentType } from '../../interfaces/iUserCompDetails';
import type { ICellRendererComp, ICellRendererParams } from '../../rendering/cellRenderers/iCellRenderer';
import { _loadTemplate } from '../../utils/dom';

export class AgComponentUtils extends BeanStub implements NamedBean {
    beanName = 'agCompUtils' as const;

    public adaptFunction(type: ComponentType, jsCompFunc: any): any {
        return type.cellRenderer ? this.adaptCellRendererFunction(jsCompFunc) : null;
    }

    private adaptCellRendererFunction(callback: any): { new (): IComponent<ICellRendererParams> } {
        class Adapter implements ICellRendererComp {
            private eGui: HTMLElement;

            refresh(): boolean {
                return false;
            }

            getGui(): HTMLElement {
                return this.eGui;
            }

            init?(params: ICellRendererParams): void {
                const callbackResult: string | HTMLElement = callback(params);
                const type = typeof callbackResult;
                if (type === 'string' || type === 'number' || type === 'boolean') {
                    this.eGui = _loadTemplate('<span>' + callbackResult + '</span>');
                    return;
                }
                if (callbackResult == null) {
                    this.eGui = _loadTemplate('<span></span>');
                    return;
                }
                this.eGui = callbackResult as HTMLElement;
            }
        }

        return Adapter;
    }
}
