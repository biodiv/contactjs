const window = globalThis["window"];

export let CustomEvent: typeof globalThis.CustomEvent;

if (window?.CustomEvent) {
    // If we're in a browser environment forward the existing CustomEvent ctor
    CustomEvent = window.CustomEvent;
} else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CustomEvent = class _<T = any> extends Event implements globalThis.CustomEvent<T> {
        public detail: T;

        public constructor(type: string, eventInitDict?: CustomEventInit<T> | undefined) {
            super(type, eventInitDict);
            this.detail = eventInitDict?.detail as T;
        }

        public initCustomEvent(): never {
            throw new Error("Unsupported deprecated method");
        }
    };
}
