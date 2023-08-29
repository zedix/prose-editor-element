import ProseEditor from './prose-editor.component.js';
export * from './prose-editor.component.js';

customElements.define('prose-editor', ProseEditor);

declare global {
  interface HTMLElementTagNameMap {
    'prose-editor': ProseEditor;
  }
}

export default ProseEditor;
