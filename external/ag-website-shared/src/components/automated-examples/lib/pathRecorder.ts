const MOUSE_POSITION_SELECTOR = '.mouse-position';

const RECORDER_BUTTON_SELECTOR = '.recorder-button';

export interface PathItem<T> {
    time: string;
    data: T;
}

function initListeners({ onSpace, mousePositionSelector, onMouseMove }) {
    // Show mouse position
    document.addEventListener('mousemove', (event) => {
        const el = document.querySelector(mousePositionSelector);
        const pos = {
            x: event.clientX,
            y: event.clientY,
        };
        el.innerHTML = `(${pos.x}, ${pos.y})`;

        onMouseMove({ event, pos });
    });

    // Listen to keyboard
    document.addEventListener('keydown', function onEvent(event) {
        if (event.code === 'Space') {
            onSpace?.();
        }
    });
}

function createRecorder() {
    let isRecording = false;
    const listeners = [];
    let recording = [];

    function toggleIsRecording() {
        isRecording = !isRecording;

        if (isRecording) {
            recording = [];
        }

        listeners.forEach((listener) => {
            listener(isRecording);
        });

        return isRecording;
    }

    return {
        record(data: any) {
            if (!isRecording) {
                return;
            }
            const time = new Date().toISOString();
            const item = {
                time,
                data,
            };
            recording.push(item);
        },
        getRecording() {
            return recording;
        },
        getIsRecording() {
            return isRecording;
        },
        toggleIsRecording,
        on(eventName, callback) {
            if (eventName === 'change') {
                listeners.push(callback);
            }
        },
    };
}

function initControls({ buttonSelector, recorder }) {
    const button = document.querySelector(buttonSelector);

    function updateButtonText() {
        button.textContent = recorder.getIsRecording() ? '🔴 Recording' : 'Start Recording';
    }

    button.addEventListener('click', () => {
        recorder.toggleIsRecording();
    });

    recorder.on('change', () => {
        updateButtonText();
    });

    // Initial update
    updateButtonText();
}

export function initPathRecorderUI() {
    const recorder = createRecorder();
    const { toggleIsRecording } = recorder;

    initControls({
        buttonSelector: RECORDER_BUTTON_SELECTOR,
        recorder,
    });

    initListeners({
        mousePositionSelector: MOUSE_POSITION_SELECTOR,
        onMouseMove: ({ pos }) => {
            recorder.record({ pos });
        },
        onSpace: () => {
            toggleIsRecording();
        },
    });

    recorder.on('change', (isRecording) => {
        if (!isRecording) {
            console.log(recorder.getRecording());
        }
    });
}
