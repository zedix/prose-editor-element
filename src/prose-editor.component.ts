import { LitElement, html, PropertyValues, CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { Editor } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
// @ts-ignore
import emojiData from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import icons from './icons';
import styles from './prose-editor.styles.js';

type ToolbarCommandName =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'divider'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'highlight'
  | 'bulletlist'
  | 'orderedlist'
  | 'blockquote'
  | 'divider'
  | 'code-block'
  | 'horizontal-rule'
  | 'link'
  | 'emoji'
  | 'divider'
  | 'undo'
  | 'redo'
  | 'attachment';

// https://web.dev/more-capable-form-controls
const formAssociatedSupported =
  'ElementInternals' in window && 'setFormData' in window.ElementInternals;

export default class ProseEditor extends LitElement {
  static styles: CSSResultGroup = styles;

  // Identify the element as a form-associated custom element
  static get formAssociated() {
    return true;
  }

  editor: Editor;
  emojiPickerElement: HTMLElement;
  _internals: ElementInternals;

  @state()
  emojiPickerActive = false;

  @property({ attribute: 'initial-html' })
  initialHtml = '';

  @property({ attribute: 'initial-json' })
  initialJson = '';

  @property({ attribute: 'editor-class' })
  editorClass = 'prose';

  @property({
    attribute: 'toolbar',
    converter: {
      fromAttribute: (value: string) => {
        return value.split(',').map((s) => s.trim());
      },
      toAttribute: (value: []) => {
        return value.join(',');
      },
    },
  })
  toolbar: ToolbarCommandName[] = [];

  @property({ attribute: 'toolbar-preset' })
  toolbarPreset: 'default' | 'minimal' = 'default';

  @property({ attribute: 'toolbar-placement' })
  toolbarPlacement: 'top' | 'bottom' = 'top';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property()
  placeholder = '';

  constructor() {
    super();

    if (formAssociatedSupported) {
      this._internals = this.attachInternals();
    }
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
  }

  firstUpdated() {
    this.editor = new Editor({
      // List of EditorOptions
      // https://github.com/ueberdosis/tiptap/blob/develop/packages/core/src/Editor.ts#L53
      element: this._createEditorRootElement(),
      editorProps: {
        attributes: {
          // Additional classes provided here will be added to the class "ProseMirror".
          // https://prosemirror.net/docs/ref/#view.EditorProps.attributes
          // https://github.com/ueberdosis/tiptap/issues/524#issuecomment-1547790806
          class: this.editorClass,
        },
      },
      extensions: [
        StarterKit,
        Link,
        Underline,
        Placeholder.configure({
          placeholder: this.placeholder,
        }),
        Highlight.configure({
          HTMLAttributes: {
            //class: 'my-custom-class',
          },
        }),
      ],
      content: this.initialHtml || this.initialJson,
      autofocus: !this.disabled,
      onCreate: () => {
        // The editor is ready.
        this.emitChange();
      },
      onTransaction: () => {
        // Force re-render so `editor.isActive` works as expected
        this.requestUpdate();
      },
      onUpdate: ({ editor }) => {
        // The content has changed.
        this.requestUpdate();
        this.emitChange();
      },
      onSelectionUpdate: () => {
        // The selection has changed.
        this.requestUpdate();
      },
    });

    this.configureToolbar();

    document.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('focus', this._onFocus);
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('focus', this._onFocus);
    this.editor.destroy();
  }

  configureToolbar() {
    if (this.toolbar.length > 0) {
      return;
    }

    if (this.toolbarPreset === 'minimal') {
      this.toolbar = ['bold', 'italic', 'underline'];
    } else {
      this.toolbar = [
        'heading-1',
        'heading-2',
        'heading-3',
        'divider',
        'bold',
        'italic',
        'underline',
        'highlight',
        'bulletlist',
        'orderedlist',
        'blockquote',
        'divider',
        'code-block',
        'horizontal-rule',
        'link',
        'emoji',
        'divider',
        'undo',
        'redo',
      ];
    }
  }

  updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has('toolbar') ||
      changedProperties.has('toolbarPreset')
    ) {
      this.configureToolbar();
    }

    if (changedProperties.has('emojiPickerActive')) {
      this._computePositionEmojiPicker();
    }
  }

  get emojiButton() {
    return this.shadowRoot!.querySelector('#emoji-picker-button');
  }

  /**
   * /!\ The ProseMirror root element must be **outside the shadowroot** to avoid
   * some DOM selection & focus bugs related to [contenteditable] inside a shadow DOM tree,
   * until these bugs are resolved:
   *
   * Firefox: fails to display the [contenteditable] caret inside a Shadow Root
   * @link https://bugzilla.mozilla.org/show_bug.cgi?id=1496769 (OPEN)
   * @link https://bugzilla.mozilla.org/show_bug.cgi?id=1685300#c6 (DUPLICATE)
   *
   * WebKit: fails to execute DOM selections inside a Shadow Root
   * @link https://bugs.webkit.org/show_bug.cgi?id=163921
   *
   * A temporary workaround is to inject the Editor in the `shadowRoot.host` instead, within a `slot`.
   *
   * Failing tree:
   *
   * ```html
   * <prose-editor>
   *  + #shadow-root
   *    + <div class="editor-wrapper">
   *        <div>
   *          <div class="ProseMirror" contenteditable="true"></div>
   *        </div>
   *      </div>
   * </prose-editor>
   * ```
   *
   * Working tree:
   *
   * ```html
   * <prose-editor>
   *  + #shadow-root
   *    + <div class="editor-wrapper">
   *        <slot name="editor">↴</slot>
   *      </div>
   *  <div slot="editor">
   *    <div class="ProseMirror" contenteditable="true"></div>
   *  </div>
   * </prose-editor>
   * ```
   */
  _createEditorRootElement() {
    // Note: element must be slotted outside the shadow root
    const element = document.createElement('div');
    element.slot = 'editor';
    // element.spellcheck = true;
    //element.classList.add('prose-content');
    this.shadowRoot!.host.appendChild(element);
    return element;
  }

  _onKeyDown({ key }: KeyboardEvent) {
    if (key === 'Escape') {
      this.emojiPickerActive = false;
    }
  }

  _onFocus() {
    if (document.activeElement !== this.editor.view.dom && !this.disabled) {
      this.focus();
    }
  }

  clear() {
    this.editor.commands.clearContent(true);
  }

  focus() {
    this.editor.commands.focus();
  }

  blur() {
    this.editor.commands.blur();
  }

  toggleBold() {
    this.editor.chain().toggleBold().focus().run();
  }

  toggleItalic() {
    this.editor.chain().toggleItalic().focus().run();
  }

  toggleUnderline() {
    this.editor.chain().toggleUnderline().focus().run();
  }

  toggleStrike() {
    this.editor.chain().toggleStrike().focus().run();
  }

  toggleHeadingLevel1() {
    this.editor.chain().toggleHeading({ level: 1 }).focus().run();
  }

  toggleHeadingLevel2() {
    this.editor.chain().toggleHeading({ level: 2 }).focus().run();
  }

  toggleHeadingLevel3() {
    this.editor.chain().toggleHeading({ level: 3 }).focus().run();
  }

  toggleBulletList() {
    this.editor.chain().toggleBulletList().focus().run();
  }

  toggleOrderedList() {
    this.editor.chain().toggleOrderedList().focus().run();
  }

  setHorizontalRule() {
    this.editor.chain().setHorizontalRule().focus().run();
  }

  toggleBlockquote() {
    this.editor.chain().toggleBlockquote().focus().run();
  }

  toggleCodeBlock() {
    this.editor.chain().toggleCodeBlock().focus().run();
  }

  toggleHighlight() {
    this.editor.chain().toggleHighlight().focus().run();
  }

  undo() {
    this.editor.chain().focus().undo().run();
  }

  redo() {
    this.editor.chain().focus().redo().run();
  }

  toggleLink() {
    if (this.editor.isActive('link')) {
      this.editor.chain().focus().unsetLink().run();
    } else {
      let url = window.prompt('URL');
      if (!url?.startsWith('http')) {
        url = `https://${url}`;
      }
      this.editor.chain().focus().setLink({ href: url }).run();
    }
  }

  toggleEmojiPicker() {
    if (!this.emojiPickerElement) {
      // @ts-ignore
      this.emojiPickerElement = new Picker({
        parent: document.body,
        data: emojiData,
        theme: 'light',
        // https://github.com/missive/emoji-mart#-picker
        onEmojiSelect: ({ native }: { native: string }) => {
          this.addEmoji(native);
          this.emojiPickerActive = false;
        },
        onClickOutside: (event: PointerEvent) => {
          if (!event.composedPath().includes(this.emojiButton!)) {
            this.emojiPickerActive = false;
          }
        },
      });

      Object.assign(this.emojiPickerElement.style, {
        transition: 'opacity .2s',
        zIndex: '999',
      });
    }

    this.emojiPickerActive = !this.emojiPickerActive;
  }

  async _computePositionEmojiPicker() {
    const emojiButton = this.emojiButton;
    if (!emojiButton) return;

    if (this.emojiPickerActive) {
      const { x, y, strategy } = await computePosition(
        emojiButton,
        this.emojiPickerElement,
        {
          placement: 'bottom',
          middleware: [
            // https://floating-ui.com/docs/offset
            // offset() should generally be placed at the beginning of your middleware array.
            offset(4),
            // https://floating-ui.com/docs/flip
            flip(),
            // https://floating-ui.com/docs/shift
            shift(),
          ],
        },
      );

      Object.assign(this.emojiPickerElement.style, {
        position: strategy,
        left: `${x}px`,
        top: `${y}px`,
      });

      Object.assign(this.emojiPickerElement.style, {
        opacity: '1',
        visibility: 'visible',
        pointerEvents: 'auto',
      });
    } else {
      Object.assign(this.emojiPickerElement.style, {
        opacity: '0',
        visibility: 'hidden',
        pointerEvents: 'none',
      });
    }
  }

  addEmoji(emoji: string) {
    this.editor.commands.insertContent(emoji);
  }

  addFile() {
    this.emit('add-file');
  }

  emitChange() {
    if (this._internals) {
      const formData = new FormData();
      formData.append('html', this.editor.getHTML());
      formData.append('json', this.editor.getJSON().text || '');
      this._internals.setFormValue(formData);
    }

    this.emit('change', {
      html: this.editor.getHTML(),
      json: this.editor.getJSON(),
    });
  }

  emit(eventName: string, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  renderToolbarButton(name: string) {
    if (!this.editor || !this.toolbar?.length) return '';

    const allToolbarItems = new Map(
      Object.entries({
        divider: html`<div class="divider" part="divider"></div>`,

        'heading-1': html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('heading', { level: 1 }),
          })}"
          @click="${this.toggleHeadingLevel1}"
        >
          ${icons.get('h1')}
        </button>`,

        'heading-2': html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('heading', { level: 2 }),
          })}"
          @click="${this.toggleHeadingLevel2}"
        >
          ${icons.get('h2')}
        </button>`,

        'heading-3': html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('heading', { level: 3 }),
          })}"
          @click="${this.toggleHeadingLevel3}"
        >
          ${icons.get('h3')}
        </button>`,

        highlight: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('highlight'),
          })}"
          @click="${this.toggleHighlight}"
        >
          ${icons.get('highlight')}
        </button>`,

        'horizontal-rule': html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('horizontal-rule'),
          })}"
          @click="${this.setHorizontalRule}"
        >
          ${icons.get('horizontal-rule')}
        </button>`,

        bold: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('bold'),
          })}"
          @click="${this.toggleBold}"
        >
          ${icons.get('bold')}
        </button>`,

        italic: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('italic'),
          })}"
          @click="${this.toggleItalic}"
        >
          ${icons.get('italic')}
        </button>`,

        underline: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('underline'),
          })}"
          @click="${this.toggleUnderline}"
        >
          ${icons.get('underline')}
        </button>`,

        strike: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('strike'),
          })}"
          @click="${this.toggleStrike}"
        >
          ${icons.get('strike')}
        </button>`,

        bulletlist: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('bulletList'),
          })}"
          @click="${this.toggleBulletList}"
        >
          ${icons.get('bullet-list')}
        </button>`,

        orderedlist: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('orderedlist'),
          })}"
          @click="${this.toggleOrderedList}"
        >
          ${icons.get('list-ordered')}
        </button>`,

        blockquote: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('blockquote'),
          })}"
          @click="${this.toggleBlockquote}"
        >
          ${icons.get('blockquote')}
        </button>`,

        'code-block': html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('codeBlock'),
          })}"
          @click="${this.toggleCodeBlock}"
        >
          ${icons.get('code-block')}
        </button>`,

        link: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button ${classMap({
            'is-active': this.editor.isActive('link'),
          })}"
          @click="${this.toggleLink}"
        >
          ${icons.get('link')}
        </button>`,

        undo: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button"
          @click="${this.undo}"
        >
          ${icons.get('undo')}
        </button>`,

        redo: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button"
          @click="${this.redo}"
        >
          ${icons.get('redo')}
        </button>`,

        emoji: html`<button
          id="emoji-picker-button"
          type="button"
          part="toolbar-button"
          class="toolbar-button"
          @click="${this.toggleEmojiPicker}"
        >
          ${icons.get('emoji')}
        </button>`,

        attachment: html`<button
          type="button"
          part="toolbar-button"
          class="toolbar-button"
          @click="${this.addFile}"
        >
          ${icons.get('attachment')}
        </button>`,
      }),
    );

    return allToolbarItems.get(name);
  }

  render() {
    return html`<div class="wrapper" part="wrapper">
      <div class="toolbar" part="toolbar">
        <slot name="toolbar-start"></slot>
        ${map(this.toolbar, (name) => this.renderToolbarButton(name))}
        <slot name="toolbar-end"></slot>
        <slot></slot>
      </div>
      <slot name="editor"></slot>
    </div>`;
  }
}
