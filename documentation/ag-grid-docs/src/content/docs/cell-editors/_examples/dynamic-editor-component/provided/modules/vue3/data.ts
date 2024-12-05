export interface IRow {
    value: string | number;
    type: 'age' | 'gender' | 'mood';
}

export function getData(): IRow[] {
    return [
        { value: 14, type: 'age' },
        { value: 'Female', type: 'gender' },
        { value: 'Happy', type: 'mood' },
        { value: 21, type: 'age' },
        { value: 'Male', type: 'gender' },
        { value: 'Sad', type: 'mood' },
    ];
}
