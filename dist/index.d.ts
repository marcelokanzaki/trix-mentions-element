import TrixMentionsElement from './trix-mentions-element';
export { TrixMentionsElement as default };
declare global {
    interface Window {
        TrixMentionsElement: typeof TrixMentionsElement;
    }
}
