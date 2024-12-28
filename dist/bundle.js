const ctrlBindings = !!navigator.userAgent.match(/Macintosh/);
class Combobox {
    constructor(input, list) {
        this.input = input;
        this.list = list;
        this.isComposing = false;
        if (!list.id) {
            list.id = `combobox-${Math.random()
                .toString()
                .slice(2, 6)}`;
        }
        this.keyboardEventHandler = event => keyboardBindings(event, this);
        this.compositionEventHandler = event => trackComposition(event, this);
        this.inputHandler = this.clearSelection.bind(this);
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-controls', list.id);
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
    }
    destroy() {
        this.clearSelection();
        this.stop();
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-controls');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-haspopup');
    }
    start() {
        this.input.setAttribute('aria-expanded', 'true');
        this.input.addEventListener('compositionstart', this.compositionEventHandler);
        this.input.addEventListener('compositionend', this.compositionEventHandler);
        this.input.addEventListener('input', this.inputHandler);
        this.input.addEventListener('keydown', this.keyboardEventHandler);
        this.list.addEventListener('click', commitWithElement);
    }
    stop() {
        this.clearSelection();
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeEventListener('compositionstart', this.compositionEventHandler);
        this.input.removeEventListener('compositionend', this.compositionEventHandler);
        this.input.removeEventListener('input', this.inputHandler);
        this.input.removeEventListener('keydown', this.keyboardEventHandler);
        this.list.removeEventListener('click', commitWithElement);
    }
    navigate(indexDiff = 1) {
        const focusEl = Array.from(this.list.querySelectorAll('[aria-selected="true"]')).filter(visible)[0];
        const els = Array.from(this.list.querySelectorAll('[role="option"]')).filter(visible);
        const focusIndex = els.indexOf(focusEl);
        if ((focusIndex === els.length - 1 && indexDiff === 1) || (focusIndex === 0 && indexDiff === -1)) {
            this.clearSelection();
            this.input.focus();
            return;
        }
        let indexOfItem = indexDiff === 1 ? 0 : els.length - 1;
        if (focusEl && focusIndex >= 0) {
            const newIndex = focusIndex + indexDiff;
            if (newIndex >= 0 && newIndex < els.length)
                indexOfItem = newIndex;
        }
        const target = els[indexOfItem];
        if (!target)
            return;
        for (const el of els) {
            if (target === el) {
                this.input.setAttribute('aria-activedescendant', target.id);
                target.setAttribute('aria-selected', 'true');
                scrollTo(this.list, target);
            }
            else {
                el.setAttribute('aria-selected', 'false');
            }
        }
    }
    clearSelection() {
        this.input.removeAttribute('aria-activedescendant');
        for (const el of this.list.querySelectorAll('[aria-selected="true"]')) {
            el.setAttribute('aria-selected', 'false');
        }
    }
}
function keyboardBindings(event, combobox) {
    if (event.shiftKey || event.metaKey || event.altKey)
        return;
    if (!ctrlBindings && event.ctrlKey)
        return;
    if (combobox.isComposing)
        return;
    switch (event.key) {
        case 'Enter':
        case 'Tab':
            if (commit(combobox.input, combobox.list)) {
                event.preventDefault();
            }
            break;
        case 'Escape':
            combobox.clearSelection();
            break;
        case 'ArrowDown':
            combobox.navigate(1);
            event.preventDefault();
            break;
        case 'ArrowUp':
            combobox.navigate(-1);
            event.preventDefault();
            break;
        case 'n':
            if (ctrlBindings && event.ctrlKey) {
                combobox.navigate(1);
                event.preventDefault();
            }
            break;
        case 'p':
            if (ctrlBindings && event.ctrlKey) {
                combobox.navigate(-1);
                event.preventDefault();
            }
            break;
        default:
            if (event.ctrlKey)
                break;
            combobox.clearSelection();
    }
}
function commitWithElement(event) {
    if (!(event.target instanceof Element))
        return;
    const target = event.target.closest('[role="option"]');
    if (!target)
        return;
    if (target.getAttribute('aria-disabled') === 'true')
        return;
    fireCommitEvent(target);
}
function commit(input, list) {
    const target = list.querySelector('[aria-selected="true"]');
    if (!target)
        return false;
    if (target.getAttribute('aria-disabled') === 'true')
        return true;
    target.click();
    return true;
}
function fireCommitEvent(target) {
    target.dispatchEvent(new CustomEvent('combobox-commit', { bubbles: true }));
}
function visible(el) {
    return (!el.hidden &&
        !(el instanceof HTMLInputElement && el.type === 'hidden') &&
        (el.offsetWidth > 0 || el.offsetHeight > 0));
}
function trackComposition(event, combobox) {
    combobox.isComposing = event.type === 'compositionstart';
    const list = document.getElementById(combobox.input.getAttribute('aria-controls') || '');
    if (!list)
        return;
    combobox.clearSelection();
}
function scrollTo(container, target) {
    if (!inViewport(container, target)) {
        container.scrollTop = target.offsetTop;
    }
}
function inViewport(container, element) {
    const scrollTop = container.scrollTop;
    const containerBottom = scrollTop + container.clientHeight;
    const top = element.offsetTop;
    const bottom = top + element.clientHeight;
    return top >= scrollTop && bottom <= containerBottom;
}

const boundary = /\s|\(|\[/;
function query(text, key, cursor, { multiWord, lookBackIndex, lastMatchPosition } = {
    multiWord: false,
    lookBackIndex: 0,
    lastMatchPosition: null
}) {
    let keyIndex = text.lastIndexOf(key, cursor - 1);
    if (keyIndex === -1)
        return;
    if (keyIndex < lookBackIndex)
        return;
    if (multiWord) {
        if (lastMatchPosition != null) {
            if (lastMatchPosition === keyIndex)
                return;
            keyIndex = lastMatchPosition - key.length;
        }
        const charAfterKey = text[keyIndex + 1];
        if (charAfterKey === ' ' && cursor >= keyIndex + key.length + 1)
            return;
        const newLineIndex = text.lastIndexOf('\n', cursor - 1);
        if (newLineIndex > keyIndex)
            return;
        const dotIndex = text.lastIndexOf('.', cursor - 1);
        if (dotIndex > keyIndex)
            return;
    }
    else {
        const spaceIndex = text.lastIndexOf(' ', cursor - 1);
        if (spaceIndex > keyIndex)
            return;
    }
    const pre = text[keyIndex - 1];
    if (pre && !boundary.test(pre))
        return;
    const queryString = text.substring(keyIndex + key.length, cursor);
    return {
        text: queryString,
        position: keyIndex + key.length
    };
}

function textFieldSelectionPosition(field, index) {
    const indexWithinRange = Math.max(0, index - 1);
    return field.editor.getClientRectAtPosition(indexWithinRange);
}

class TrixEditorElementAdapter {
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
function buildTrixAttachment(elementOrOptions) {
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
function assertTrixEditorElement(element) {
    if (element && element.localName === 'trix-editor')
        return;
    throw new Error('Only trix-editor elements are supported');
}

function getFrameElementById(id) {
    return document.querySelector(`turbo-frame#${id}:not([disabled])`);
}
function setSearchParam(element, src, name, value) {
    const url = new URL(src || element.getAttribute('src') || '', element.baseURI);
    url.searchParams.set(name, value);
    element.setAttribute('src', url.toString());
    return element.loaded || Promise.resolve();
}

const states = new WeakMap();
const DEBOUNCE_DELAY = 150;
class TrixMentionsExpander {
    constructor(expander) {
        this.expander = expander;
        this.combobox = null;
        this.menu = null;
        this.match = null;
        this.justPasted = false;
        this.lookBackIndex = 0;
        this.oninput = this.onInput.bind(this);
        this.onpaste = this.onPaste.bind(this);
        this.onkeydown = this.onKeydown.bind(this);
        this.oncommit = this.onCommit.bind(this);
        this.onmousedown = this.onMousedown.bind(this);
        this.onblur = this.onBlur.bind(this);
        this.interactingWithList = false;
        expander.addEventListener('paste', this.onpaste);
        expander.addEventListener('input', this.oninput, { capture: true });
        expander.addEventListener('keydown', this.onkeydown);
        expander.addEventListener('focusout', this.onblur);
        this.debounceTimeout = null;
    }
    get input() {
        const input = this.expander.querySelector('trix-editor');
        assertTrixEditorElement(input);
        return new TrixEditorElementAdapter(input);
    }
    destroy() {
        this.expander.removeEventListener('paste', this.onpaste);
        this.expander.removeEventListener('input', this.oninput, { capture: true });
        this.expander.removeEventListener('keydown', this.onkeydown);
        this.expander.removeEventListener('focusout', this.onblur);
        if (this.debounceTimeout) {
            window.clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }
    dismissMenu() {
        if (this.deactivate()) {
            this.lookBackIndex = this.input.selectionEnd || this.lookBackIndex;
        }
    }
    activate(match, menu) {
        var _a, _b;
        if (this.input.element !== document.activeElement &&
            this.input.element !== ((_b = (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.shadowRoot) === null || _b === void 0 ? void 0 : _b.activeElement)) {
            return;
        }
        this.deactivate();
        this.menu = [menu, menu.isConnected];
        if (!menu.id)
            menu.id = `trix-mentions-${Math.floor(Math.random() * 100000).toString()}`;
        if (menu.isConnected) {
            menu.hidden = false;
        }
        else {
            this.expander.append(menu);
        }
        this.combobox = new Combobox(this.input.element, menu);
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-multiline', 'false');
        const { bottom, left } = textFieldSelectionPosition(this.input, match.position);
        menu.style.top = `${bottom}px`;
        menu.style.left = `${left}px`;
        this.combobox.start();
        menu.addEventListener('combobox-commit', this.oncommit);
        menu.addEventListener('mousedown', this.onmousedown);
        this.combobox.navigate(1);
    }
    deactivate() {
        if (!this.menu || !this.combobox)
            return false;
        const [menu, isConnected] = this.menu;
        this.menu = null;
        menu.removeEventListener('combobox-commit', this.oncommit);
        menu.removeEventListener('mousedown', this.onmousedown);
        this.combobox.destroy();
        this.combobox = null;
        this.input.removeAttribute('aria-multiline');
        this.input.setAttribute('role', 'textbox');
        if (isConnected) {
            menu.hidden = true;
        }
        else {
            menu.remove();
        }
        return true;
    }
    onCommit({ target }) {
        const item = target;
        if (!(item instanceof HTMLElement))
            return;
        if (!this.combobox)
            return;
        const match = this.match;
        if (!match)
            return;
        const selectionStart = match.position - match.key.length;
        const selectionEnd = match.position + match.text.length;
        const detail = { item, key: match.key, value: null };
        const canceled = !this.expander.dispatchEvent(new CustomEvent('trix-mentions-value', { cancelable: true, detail }));
        if (canceled)
            return;
        const attachment = buildTrixAttachment(detail.value || item);
        if (!attachment)
            return;
        this.input.editor.setSelectedRange([selectionStart, selectionEnd]);
        this.input.editor.deleteInDirection('backward');
        this.input.editor.insertAttachment(attachment);
        const cursor = this.input.selectionEnd;
        this.deactivate();
        this.input.focus({
            preventScroll: true
        });
        this.lookBackIndex = cursor;
        this.match = null;
    }
    onBlur({ target }) {
        if (target !== this.input.element)
            return;
        if (this.interactingWithList) {
            this.interactingWithList = false;
            return;
        }
        this.deactivate();
    }
    onPaste({ target }) {
        if (target !== this.input.element)
            return;
        this.justPasted = true;
    }
    async onInput({ target }) {
        if (target !== this.input.element)
            return;
        if (this.justPasted) {
            this.justPasted = false;
            return;
        }
        if (this.debounceTimeout) {
            window.clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = window.setTimeout(async () => {
            const match = this.findMatch();
            if (match) {
                this.match = match;
                const menu = await this.notifyProviders(match);
                if (!this.match)
                    return;
                if (menu) {
                    this.activate(match, menu);
                }
                else {
                    this.deactivate();
                }
            }
            else {
                this.match = null;
                this.deactivate();
            }
            this.debounceTimeout = null;
        }, DEBOUNCE_DELAY);
    }
    findMatch() {
        const cursor = this.input.selectionEnd || 0;
        const text = this.input.value.replace(/\n+$/, '');
        if (cursor <= this.lookBackIndex) {
            this.lookBackIndex = cursor - 1;
        }
        for (const { key, multiWord } of this.expander.keys) {
            const found = query(text, key, cursor, {
                multiWord,
                lookBackIndex: this.lookBackIndex,
                lastMatchPosition: this.match ? this.match.position : null
            });
            if (found) {
                return { text: found.text, key, position: found.position };
            }
        }
    }
    async notifyProviders(match) {
        const providers = [];
        const provide = (result) => providers.push(result);
        const canceled = !this.expander.dispatchEvent(new CustomEvent('trix-mentions-change', { cancelable: true, detail: { provide, text: match.text, key: match.key } }));
        if (canceled)
            return;
        if (providers.length > 0) {
            const all = await Promise.all(providers);
            const fragments = all.filter(x => x.matched).map(x => x.fragment);
            return fragments[0];
        }
        else {
            return this.driveTurboFrame(match);
        }
    }
    onMousedown() {
        this.interactingWithList = true;
    }
    onKeydown(event) {
        if (event.target !== this.input.element)
            return;
        if (event.key === 'Escape') {
            this.match = null;
            if (this.deactivate()) {
                this.lookBackIndex = this.input.selectionEnd || this.lookBackIndex;
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        }
    }
    async driveTurboFrame(match) {
        const name = this.expander.name;
        const frame = getFrameElementById(this.expander.getAttribute('data-turbo-frame'));
        if (name && frame) {
            await setSearchParam(frame, this.expander.src, name, match.text);
            if (frame.childElementCount > 0) {
                return frame;
            }
        }
    }
}
class TrixMentionsElement extends HTMLElement {
    get keys() {
        const keysAttr = this.getAttribute('keys');
        const keys = keysAttr ? keysAttr.split(' ') : [];
        const multiWordAttr = this.getAttribute('multiword');
        const multiWord = multiWordAttr ? multiWordAttr.split(' ') : [];
        const globalMultiWord = multiWord.length === 0 && this.hasAttribute('multiword');
        return keys.map(key => ({ key, multiWord: globalMultiWord || multiWord.includes(key) }));
    }
    get src() {
        return this.getAttribute('src');
    }
    set src(value) {
        if (value === null || typeof value === 'undefined') {
            this.removeAttribute('src');
        }
        else {
            this.setAttribute('src', value);
        }
    }
    get name() {
        return this.getAttribute('name');
    }
    set name(value) {
        if (value === null || typeof value === 'undefined') {
            this.removeAttribute('name');
        }
        else {
            this.setAttribute('name', value);
        }
    }
    connectedCallback() {
        const state = new TrixMentionsExpander(this);
        states.set(this, state);
    }
    disconnectedCallback() {
        const state = states.get(this);
        if (!state)
            return;
        state.destroy();
        states.delete(this);
    }
    dismiss() {
        const state = states.get(this);
        if (!state)
            return;
        state.dismissMenu();
    }
}
TrixMentionsElement.DEBOUNCE_DELAY = DEBOUNCE_DELAY;

if (!window.customElements.get('trix-mentions')) {
    window.TrixMentionsElement = TrixMentionsElement;
    window.customElements.define('trix-mentions', TrixMentionsElement);
}

export default TrixMentionsElement;
