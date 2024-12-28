export declare type FrameElement = HTMLElement & {
    loaded: Promise<void> | null;
};
export declare function getFrameElementById(id: string | null): FrameElement | null;
export declare function setSearchParam(element: FrameElement, src: string | null, name: string, value: string): Promise<void>;
