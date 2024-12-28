export class TrixEditorElementAdapter {
    constructor(element) {
        this.element = element;
    }
    focus(options) {
        this.element.focus(options);
    }
    removeAttribute(name) {
        this.element.removeAttribute(name);
    }
    setAttribute(name, value) {
        this.element.setAttribute(name, value);
    }
    get selectionEnd() {
        return this.editor.getPosition() + 1;
    }
    get value() {
        return this.editor.getDocument().toString();
    }
    get editor() {
        return this.element.editor;
    }
}
function getJSONAttribute(element, key) {
    try {
        const value = element.getAttribute(key);
        return JSON.parse(value || '{}');
    }
    catch (_a) {
        return {};
    }
}
function extractDataAttribute(dataset, key, prefix) {
    const value = dataset[key];
    const unprefixed = key.replace(prefix, '');
    const firstCharacter = unprefixed[0];
    const rest = unprefixed.substring(1);
    const name = firstCharacter.toLowerCase() + rest;
    return [name, value];
}
export function buildTrixAttachment(elementOrOptions) {
    const attribute = 'data-trix-attachment';
    const prefix = 'trixAttachment';
    if (elementOrOptions instanceof HTMLElement) {
        const element = elementOrOptions;
        const defaults = { content: element.innerHTML };
        const options = getJSONAttribute(element, attribute);
        const overrides = {};
        const { dataset } = element;
        for (const key in dataset) {
            if (key.startsWith(prefix) && key !== prefix) {
                const [name, value] = extractDataAttribute(dataset, key, prefix);
                overrides[name] = value;
            }
        }
        return new Trix.Attachment(Object.assign(Object.assign(Object.assign({}, defaults), options), overrides));
    }
    else if (elementOrOptions) {
        const options = elementOrOptions;
        return new Trix.Attachment(options);
    }
    else {
        return null;
    }
}
export function assertTrixEditorElement(element) {
    if (element && element.localName === 'trix-editor')
        return;
    throw new Error('Only trix-editor elements are supported');
}
