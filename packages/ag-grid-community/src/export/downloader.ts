import { _warn } from '../validation/logging';

export function _downloadFile(fileName: string, content: Blob) {
    const win = document.defaultView || window;

    if (!win) {
        _warn(52);
        return;
    }

    const element = document.createElement('a');
    const url = win.URL.createObjectURL(content);
    element.setAttribute('href', url);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);

    element.dispatchEvent(
        new MouseEvent('click', {
            bubbles: false,
            cancelable: true,
            view: win,
        })
    );

    document.body.removeChild(element);

    win.setTimeout(() => {
        win.URL.revokeObjectURL(url);
    }, 0);
}
