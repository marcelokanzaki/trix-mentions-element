export declare type TrixAttachment = any;
export declare type TrixDocument = {
    toString(): string;
};
export declare type TrixEditor = {
    deleteInDirection(direction: 'backward'): void;
    insertAttachment(attachment: TrixAttachment): void;
    getClientRectAtPosition(position: number): DOMRect;
    getDocument(): TrixDocument;
    getPosition(): number;
    setSelectedRange(range: number | [number] | [number, number]): void;
};
export declare type TrixEditorElement = HTMLElement & {
    editor: TrixEditor;
};
export interface TrixEditorInput {
    element: TrixEditorElement;
    editor: TrixEditor;
    value: string;
    selectionEnd: number;
    focus(options?: FocusOptions): void;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
}
export declare class TrixEditorElementAdapter implements TrixEditorInput {
    readonly element: TrixEditorElement;
    constructor(element: TrixEditorElement);
    focus(options?: FocusOptions): void;
    removeAttribute(name: string): void;
    setAttribute(name: string, value: string): void;
    get selectionEnd(): number;
    get value(): string;
    get editor(): TrixEditor;
}
declare global {
    const Trix: {
        Attachment: TrixAttachment;
    };
}
export declare function buildTrixAttachment(elementOrOptions: HTMLElement | Record<string, unknown>): TrixAttachment | null;
export declare function assertTrixEditorElement(element: Element | null): asserts element is TrixEditorElement;
