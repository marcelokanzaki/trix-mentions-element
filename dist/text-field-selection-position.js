export default function textFieldSelectionPosition(field, index) {
    const indexWithinRange = Math.max(0, index - 1);
    return field.editor.getClientRectAtPosition(indexWithinRange);
}
