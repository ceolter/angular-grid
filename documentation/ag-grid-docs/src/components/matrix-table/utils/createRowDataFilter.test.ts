import { createRowDataFilter } from './createRowDataFilter';

describe('createRowDataFilter', () => {
    describe('filters one field', () => {
        const data = [
            {
                key: 1,
                enterprise: true,
            },
            {
                key: 2,
            },
            {
                key: 3,
            },
        ];

        it('positive filter', () => {
            expect(data.filter(createRowDataFilter('enterprise'))).toEqual([
                {
                    key: 1,
                    enterprise: true,
                },
            ]);
        });

        it('negative filter', () => {
            expect(data.filter(createRowDataFilter('!enterprise'))).toEqual([
                {
                    key: 2,
                },
                {
                    key: 3,
                },
            ]);
        });
    });

    describe('filters with ! and &&', () => {
        const data = [
            {
                key: 1,
                enterprise: true,
                framework: true,
            },
            {
                key: 2,
                enterprise: true,
            },
            {
                key: 3,
                framework: true,
            },
            {
                key: 4,
                somethingElse: true,
            },
        ];

        it('!enterprise && !framework', () => {
            expect(data.filter(createRowDataFilter('!enterprise && !framework'))).toEqual([
                {
                    key: 4,
                    somethingElse: true,
                },
            ]);
        });
    });

    describe('filters with ||', () => {
        const data = [
            {
                key: 1,
                enterprise: true,
                react: true,
            },
            {
                key: 2,
                angular: true,
            },
            {
                key: 3,
            },
        ];

        it('react || angular', () => {
            expect(data.filter(createRowDataFilter('react || angular'))).toEqual([
                {
                    key: 1,
                    enterprise: true,
                    react: true,
                },
                {
                    key: 2,
                    angular: true,
                },
            ]);
        });
    });

    describe('filters with &&', () => {
        const data = [
            {
                key: 1,
                module: true,
                package: true,
            },
            {
                key: 2,
                module: true,
            },
            {
                key: 3,
                package: true,
            },
        ];

        it('module && package', () => {
            expect(data.filter(createRowDataFilter('module && package'))).toEqual([
                {
                    key: 1,
                    module: true,
                    package: true,
                },
            ]);
        });
    });

    describe('filters with && and ||', () => {
        const data = [
            {
                key: 1,
                module: true,
                package: true,
            },
            {
                key: 2,
                module: true,
            },
            {
                key: 3,
                package: true,
                new: true,
            },
            {
                key: 4,
                module: true,
                new: true,
            },
        ];

        it('module && package || new', () => {
            expect(data.filter(createRowDataFilter('module && package || new'))).toEqual([
                {
                    key: 1,
                    module: true,
                    package: true,
                },
                {
                    key: 3,
                    package: true,
                    new: true,
                },
                {
                    key: 4,
                    module: true,
                    new: true,
                },
            ]);
        });

        it('module || package && new', () => {
            expect(data.filter(createRowDataFilter('module || package && new'))).toEqual([
                {
                    key: 3,
                    package: true,
                    new: true,
                },
                {
                    key: 4,
                    module: true,
                    new: true,
                },
            ]);
        });

        it('package || module && new', () => {
            expect(data.filter(createRowDataFilter('package || module && new'))).toEqual([
                {
                    key: 3,
                    package: true,
                    new: true,
                },
                {
                    key: 4,
                    module: true,
                    new: true,
                },
            ]);
        });
    });
});
