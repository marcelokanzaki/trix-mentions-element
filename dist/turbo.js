export function getFrameElementById(id) {
    return document.querySelector(`turbo-frame#${id}:not([disabled])`);
}
export function setSearchParam(element, src, name, value) {
    const url = new URL(src || element.getAttribute('src') || '', element.baseURI);
    url.searchParams.set(name, value);
    element.setAttribute('src', url.toString());
    return element.loaded || Promise.resolve();
}
