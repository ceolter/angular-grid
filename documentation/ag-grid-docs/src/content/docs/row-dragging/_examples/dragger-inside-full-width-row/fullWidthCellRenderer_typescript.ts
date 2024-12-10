import type { ICellRendererComp, ICellRendererParams } from 'ag-grid-community';

export class FullWidthCellRenderer implements ICellRendererComp {
    eGui!: HTMLElement;

    init(params: ICellRendererParams) {
        // trick to convert string of html into dom object
        const eTemp = document.createElement('div');
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild as HTMLElement;
        params.registerRowDragger(this.eGui, undefined, params.data.name, true);
        this.consumeMouseWheelOnCenterText();
    }

    getTemplate(params: ICellRendererParams) {
        // the flower row shares the same data as the parent row
        const data = params.node.data;

        const template =
            '<div class="full-width-panel">' +
            '  <div class="full-width-flag">' +
            '    <img border="0" src="https://www.ag-grid.com/example-assets/large-flags/' +
            data.code +
            '.png">' +
            '  </div>' +
            '  <div class="full-width-summary">' +
            '    <span class="full-width-title">' +
            data.name +
            '</span><br/>' +
            '    <label><b>Population:</b> ' +
            data.population +
            '</label><br/>' +
            '    <label><b>Language:</b> ' +
            data.language +
            '</label><br/>' +
            '  </div>' +
            '  <div class="full-width-center">' +
            latinText() +
            '  </div>' +
            '</div>';

        return template;
    }

    getGui() {
        return this.eGui;
    }

    // if we don't do this, then the mouse wheel will be picked up by the main
    // grid and scroll the main grid and not this component. this ensures that
    // the wheel move is only picked up by the text field
    consumeMouseWheelOnCenterText() {
        const eFullWidthCenter = this.eGui.querySelector('.full-width-center')!;

        const mouseWheelListener = function (event: any) {
            event.stopPropagation();
        };

        // event is 'mousewheel' for IE9, Chrome, Safari, Opera
        eFullWidthCenter.addEventListener('mousewheel', mouseWheelListener);
        // event is 'DOMMouseScroll' Firefox
        eFullWidthCenter.addEventListener('DOMMouseScroll', mouseWheelListener);
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

function latinText() {
    return '<p>Sample Text in a Paragraph</p><p>Lorem ipsum dolor sit amet, his mazim necessitatibus te, mea volutpat intellegebat at. Ea nec perpetua liberavisse, et modo rebum persius pri. Velit recteque reprimique quo at. Vis ex persius oporteat, esse voluptatum moderatius te vis. Ex agam suscipit aliquando eum. Mediocrem molestiae id pri, ei cibo facilisis mel. Ne sale nonumy sea. Et vel lorem omittam vulputate. Ne prima impedit percipitur vis, erat summo an pro. Id urbanitas deterruisset cum, at legere oportere has. No saperet lobortis elaboraret qui, alii zril at vix, nulla soluta ornatus per ad. Feugiat consequuntur vis ad, te sit quodsi persequeris, labore perpetua mei ad. Ex sea affert ullamcorper disputationi, sit nisl elit elaboraret te, quodsi doctus verear ut eam. Eu vel malis nominati, per ex melius delenit incorrupte. Partem complectitur sed in. Vix dicta tincidunt ea. Id nec urbanitas voluptaria, pri no nostro disputationi. Falli graeco salutatus pri ea.</p><p>Quo ad omnesque phaedrum principes, tale urbanitas constituam et ius, pericula consequat ad est. Ius tractatos referrentur deterruisset an, odio consequuntur sed ad. Ea molestie adipiscing adversarium eos, tale veniam sea no. Mutat nullam philosophia sed ad. Pri eu dicta consulatu, te mollis quaerendum sea. Ei doming commodo euismod vis. Cu modus aliquip inermis his, eos et eirmod regione delicata, at odio definiebas vis.</p><p>Lorem ipsum dolor sit amet, his mazim necessitatibus te, mea volutpat intellegebat at. Ea nec perpetua liberavisse, et modo rebum persius pri. Velit recteque reprimique quo at. Vis ex persius oporteat, esse voluptatum moderatius te vis. Ex agam suscipit aliquando eum. Mediocrem molestiae id pri, ei cibo facilisis mel. Ne sale nonumy sea. Et vel lorem omittam vulputate. Ne prima impedit percipitur vis, erat summo an pro. Id urbanitas deterruisset cum, at legere oportere has. No saperet lobortis elaboraret qui, alii zril at vix, nulla soluta ornatus per ad. Feugiat consequuntur vis ad, te sit quodsi persequeris, labore perpetua mei ad. Ex sea affert ullamcorper disputationi, sit nisl elit elaboraret te, quodsi doctus verear ut eam. Eu vel malis nominati, per ex melius delenit incorrupte. Partem complectitur sed in. Vix dicta tincidunt ea. Id nec urbanitas voluptaria, pri no nostro disputationi. Falli graeco salutatus pri ea.</p><p>Quo ad omnesque phaedrum principes, tale urbanitas constituam et ius, pericula consequat ad est. Ius tractatos referrentur deterruisset an, odio consequuntur sed ad. Ea molestie adipiscing adversarium eos, tale veniam sea no. Mutat nullam philosophia sed ad. Pri eu dicta consulatu, te mollis quaerendum sea. Ei doming commodo euismod vis. Cu modus aliquip inermis his, eos et eirmod regione delicata, at odio definiebas vis.</p>';
}
