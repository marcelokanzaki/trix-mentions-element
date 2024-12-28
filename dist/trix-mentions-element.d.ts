declare type Key = {
    key: string;
    multiWord: boolean;
};
export default class TrixMentionsElement extends HTMLElement {
    static DEBOUNCE_DELAY: number;
    get keys(): Key[];
    get src(): string | null;
    set src(value: string | null);
    get name(): string | null;
    set name(value: string | null);
    connectedCallback(): void;
    disconnectedCallback(): void;
    dismiss(): void;
}
export {};
