const files = [
    { path: ['Desktop', 'ProjectAlpha', 'Proposal.docx'], size: 512000, created: '2023-07-10', modified: '2023-08-01' },
    {
        path: ['Desktop', 'ProjectAlpha', 'Timeline.xlsx'],
        size: 1048576,
        created: '2023-07-12',
        modified: '2023-08-03',
    },
    { path: ['Desktop', 'ToDoList.txt'], size: 51200, created: '2023-08-05', modified: '2023-08-10' },
    { path: ['Desktop', 'MeetingNotes_August.pdf'], size: 460800, created: '2023-08-15', modified: '2023-08-15' },
    {
        path: ['Documents', 'Work', 'ProjectAlpha', 'Proposal.docx'],
        size: 512000,
        created: '2023-07-10',
        modified: '2023-08-01',
    },
    {
        path: ['Documents', 'Work', 'ProjectAlpha', 'Timeline.xlsx'],
        size: 1048576,
        created: '2023-07-12',
        modified: '2023-08-03',
    },
    {
        path: ['Documents', 'Work', 'ProjectBeta', 'Report.pdf'],
        size: 1024000,
        created: '2023-06-22',
        modified: '2023-07-15',
    },
    {
        path: ['Documents', 'Work', 'ProjectBeta', 'Budget.xlsx'],
        size: 1048576,
        created: '2023-06-25',
        modified: '2023-07-18',
    },
    {
        path: ['Documents', 'Work', 'Meetings', 'TeamMeeting_August.pdf'],
        size: 512000,
        created: '2023-08-20',
        modified: '2023-08-21',
    },
    {
        path: ['Documents', 'Work', 'Meetings', 'ClientMeeting_July.pdf'],
        size: 1048576,
        created: '2023-07-15',
        modified: '2023-07-16',
    },
    {
        path: ['Documents', 'Personal', 'Taxes', '2022.pdf'],
        size: 1024000,
        created: '2023-04-10',
        modified: '2023-04-10',
    },
    {
        path: ['Documents', 'Personal', 'Taxes', '2021.pdf'],
        size: 1048576,
        created: '2022-04-05',
        modified: '2022-04-06',
    },
    {
        path: ['Documents', 'Personal', 'Taxes', '2020.pdf'],
        size: 1024000,
        created: '2021-04-03',
        modified: '2021-04-03',
    },
    { path: ['Pictures', 'Vacation2019', 'Beach.jpg'], size: 1048576, created: '2019-07-10', modified: '2019-07-12' },
    {
        path: ['Pictures', 'Vacation2019', 'Mountain.png'],
        size: 2048000,
        created: '2019-07-11',
        modified: '2019-07-13',
    },
    { path: ['Pictures', 'Family', 'Birthday2022.jpg'], size: 3072000, created: '2022-12-15', modified: '2022-12-20' },
    { path: ['Pictures', 'Family', 'Christmas2021.png'], size: 2048000, created: '2021-12-25', modified: '2021-12-26' },
    { path: ['Videos', 'Vacation2019', 'Beach.mov'], size: 4194304, created: '2019-07-10', modified: '2019-07-12' },
    { path: ['Videos', 'Vacation2019', 'Hiking.mp4'], size: 4194304, created: '2019-07-15', modified: '2019-07-16' },
    { path: ['Videos', 'Family', 'Birthday2022.mp4'], size: 6291456, created: '2022-12-15', modified: '2022-12-20' },
    { path: ['Videos', 'Family', 'Christmas2021.mov'], size: 6291456, created: '2021-12-25', modified: '2021-12-26' },
    { path: ['Downloads', 'SoftwareInstaller.exe'], size: 2097152, created: '2023-08-01', modified: '2023-08-01' },
    { path: ['Downloads', 'Receipt_OnlineStore.pdf'], size: 1048576, created: '2023-08-05', modified: '2023-08-05' },
    { path: ['Downloads', 'Ebook.pdf'], size: 1048576, created: '2023-08-08', modified: '2023-08-08' },
];

export function getData() {
    return files;
}
