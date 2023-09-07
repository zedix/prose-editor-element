import ProseEditor from './prose-editor.component.js';
export * from './prose-editor.component.js';

customElements.define('zx-prose-editor', ProseEditor);

declare global {
  interface HTMLElementTagNameMap {
    'zx-prose-editor': ProseEditor;
  }
}

export default ProseEditor;
