import type { Component } from 'ag-grid-community';
import {
    BeanStub,
    KeyCode,
    _getActiveDomElement,
    _isStopPropagationForAgGrid,
    _stopPropagationForAgGrid,
} from 'ag-grid-community';

export class AdvancedFilterBuilderItemNavigationFeature extends BeanStub {
    constructor(
        private readonly eGui: HTMLElement,
        private readonly focusWrapper: HTMLElement,
        private readonly eFocusableComp: Component<any>
    ) {
        super();
    }

    public postConstruct(): void {
        this.addManagedElementListeners(this.eGui, {
            keydown: (event: KeyboardEvent) => {
                switch (event.key) {
                    case KeyCode.TAB:
                        if (!event.defaultPrevented) {
                            // tab guard handled the navigation. stop from reaching virtual list
                            _stopPropagationForAgGrid(event);
                        }
                        break;
                    case KeyCode.UP:
                    case KeyCode.DOWN:
                        // if this hasn't been handled by an editor, prevent virtual list navigation
                        _stopPropagationForAgGrid(event);
                        break;
                    case KeyCode.ESCAPE:
                        if (_isStopPropagationForAgGrid(event)) {
                            return;
                        }
                        if (this.eGui.contains(_getActiveDomElement(this.beans))) {
                            event.preventDefault();
                            _stopPropagationForAgGrid(event);
                            this.focusWrapper.focus();
                        }
                        break;
                }
            },
        });
        const highlightClass = 'ag-advanced-filter-builder-virtual-list-item-highlight';
        this.addManagedListeners(this.focusWrapper, {
            keydown: (event: KeyboardEvent) => {
                switch (event.key) {
                    case KeyCode.ENTER:
                        if (_isStopPropagationForAgGrid(event)) {
                            return;
                        }
                        if (_getActiveDomElement(this.beans) === this.focusWrapper) {
                            event.preventDefault();
                            _stopPropagationForAgGrid(event);
                            this.eFocusableComp.getFocusableElement().focus();
                        }
                        break;
                }
            },
            focusin: () => {
                this.focusWrapper.classList.add(highlightClass);
            },
            focusout: (event: FocusEvent) => {
                if (!this.focusWrapper.contains(event.relatedTarget as HTMLElement)) {
                    this.focusWrapper.classList.remove(highlightClass);
                }
            },
        });
    }
}
