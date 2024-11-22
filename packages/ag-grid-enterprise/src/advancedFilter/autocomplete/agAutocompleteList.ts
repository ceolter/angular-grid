import type { Component } from 'ag-grid-community';
import { KeyCode, PopupComponent, RefPlaceholder, _exists, _fuzzySuggestions } from 'ag-grid-community';

import { VirtualList } from '../../widgets/virtualList';
import { AgAutocompleteRow } from './agAutocompleteRow';
import type { AutocompleteEntry } from './autocompleteParams';

export class AgAutocompleteList extends PopupComponent {
    private readonly eList: HTMLElement = RefPlaceholder;

    private virtualList: VirtualList<any>;

    private autocompleteEntries: AutocompleteEntry[];

    // as the user moves the mouse, the selectedValue changes
    private selectedValue: AutocompleteEntry;

    private searchString = '';

    constructor(
        private params: {
            autocompleteEntries: AutocompleteEntry[];
            onConfirmed: () => void;
            useFuzzySearch?: boolean;
            forceLastSelection?: (lastSelection: AutocompleteEntry, searchString: string) => boolean;
        }
    ) {
        super(/* html */ `<div class="ag-autocomplete-list-popup">
            <div data-ref="eList" class="ag-autocomplete-list"></div>
        <div>`);
    }

    public postConstruct(): void {
        this.autocompleteEntries = this.params.autocompleteEntries;
        this.virtualList = this.createManagedBean(new VirtualList({ cssIdentifier: 'autocomplete' }));
        this.virtualList.setComponentCreator(this.createRowComponent.bind(this));
        this.eList.appendChild(this.virtualList.getGui());

        this.virtualList.setModel({
            getRowCount: () => this.autocompleteEntries.length,
            getRow: (index: number) => this.autocompleteEntries[index],
        });

        const virtualListGui = this.virtualList.getGui();

        this.addManagedListeners(virtualListGui, {
            click: () => this.params.onConfirmed(),
            mousemove: this.onMouseMove.bind(this),
            mousedown: (e) => e.preventDefault(),
        });

        this.setSelectedValue(0);
    }

    public onNavigationKeyDown(event: any, key: string): void {
        // if we don't preventDefault the page body and/or grid scroll will move.
        event.preventDefault();
        const oldIndex = this.autocompleteEntries.indexOf(this.selectedValue);
        const newIndex = key === KeyCode.UP ? oldIndex - 1 : oldIndex + 1;

        this.checkSetSelectedValue(newIndex);
    }

    public setSearch(searchString: string): void {
        this.searchString = searchString;
        if (_exists(searchString)) {
            this.runSearch();
        } else {
            // reset
            this.autocompleteEntries = this.params.autocompleteEntries;
            this.virtualList.refresh();
            this.checkSetSelectedValue(0);
        }
        this.updateSearchInList();
    }

    private runContainsSearch(
        searchString: string,
        searchStrings: string[]
    ): { topMatch: string | undefined; allMatches: string[] } {
        let topMatch: string | undefined;
        let topMatchStartsWithSearchString = false;
        const lowerCaseSearchString = searchString.toLocaleLowerCase();
        const allMatches = searchStrings.filter((string) => {
            const lowerCaseString = string.toLocaleLowerCase();
            const index = lowerCaseString.indexOf(lowerCaseSearchString);
            const startsWithSearchString = index === 0;
            const isMatch = index >= 0;
            // top match is shortest value that starts with the search string, otherwise shortest value that includes the search string
            if (
                isMatch &&
                (!topMatch ||
                    (!topMatchStartsWithSearchString && startsWithSearchString) ||
                    (topMatchStartsWithSearchString === startsWithSearchString && string.length < topMatch.length))
            ) {
                topMatch = string;
                topMatchStartsWithSearchString = startsWithSearchString;
            }
            return isMatch;
        });
        if (!topMatch && allMatches.length) {
            topMatch = allMatches[0];
        }
        return { topMatch, allMatches };
    }

    private runSearch() {
        const { autocompleteEntries, useFuzzySearch, forceLastSelection } = this.params;
        const searchStrings = autocompleteEntries.map((v) => v.displayValue ?? v.key);

        let matchingStrings: string[];
        let topSuggestion: string | undefined;
        if (useFuzzySearch) {
            matchingStrings = _fuzzySuggestions({
                inputValue: this.searchString,
                allSuggestions: searchStrings,
                hideIrrelevant: true,
                addSequentialWeight: true,
            }).values;
            topSuggestion = matchingStrings.length ? matchingStrings[0] : undefined;
        } else {
            const containsMatches = this.runContainsSearch(this.searchString, searchStrings);
            matchingStrings = containsMatches.allMatches;
            topSuggestion = containsMatches.topMatch;
        }

        let filteredEntries = autocompleteEntries.filter(({ key, displayValue }) =>
            matchingStrings.includes(displayValue ?? key)
        );
        if (
            !filteredEntries.length &&
            this.selectedValue &&
            forceLastSelection?.(this.selectedValue, this.searchString)
        ) {
            filteredEntries = [this.selectedValue];
        }
        this.autocompleteEntries = filteredEntries;
        this.virtualList.refresh();

        if (!topSuggestion) {
            return;
        }

        const topSuggestionIndex = matchingStrings.indexOf(topSuggestion);

        this.checkSetSelectedValue(topSuggestionIndex);
    }

    private updateSearchInList(): void {
        this.virtualList.forEachRenderedRow((row: AgAutocompleteRow) => row.setSearchString(this.searchString));
    }

    private checkSetSelectedValue(index: number): void {
        if (index >= 0 && index < this.autocompleteEntries.length) {
            this.setSelectedValue(index);
        }
    }

    private setSelectedValue(index: number): void {
        const value = this.autocompleteEntries[index];

        if (this.selectedValue === value) {
            return;
        }

        this.selectedValue = value;
        this.virtualList.ensureIndexVisible(index);

        this.virtualList.forEachRenderedRow((cmp: AgAutocompleteRow, idx: number) => {
            cmp.updateSelected(index === idx);
        });
    }

    private createRowComponent(value: AutocompleteEntry): Component {
        const row = new AgAutocompleteRow();

        this.createBean(row);
        row.setState(value.displayValue ?? value.key, value === this.selectedValue);

        return row;
    }

    private onMouseMove(mouseEvent: MouseEvent): void {
        const { getGui, getScrollTop, getRowHeight } = this.virtualList;
        const rect = getGui().getBoundingClientRect();
        const scrollTop = getScrollTop();
        const mouseY = mouseEvent.clientY - rect.top + scrollTop;
        const row = Math.floor(mouseY / getRowHeight());

        this.checkSetSelectedValue(row);
    }

    public afterGuiAttached(): void {
        this.virtualList.refresh();
    }

    public getSelectedValue(): AutocompleteEntry | null {
        if (!this.autocompleteEntries.length) {
            return null;
        }
        return this.selectedValue ?? null;
    }
}
