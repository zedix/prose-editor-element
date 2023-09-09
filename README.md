# Prose Editor

![version](https://img.shields.io/github/package-json/v/zedix/prose-editor-element.svg?maxAge=60) [![lit](https://img.shields.io/badge/lib-lit-blue.svg?maxAge=60)](https://github.com/lit/lit/)

Prose Editor is a web component wrapping [TipTap 2](https://www.tiptap.dev/).

![image](https://github.com/zedix/prose-editor-element/assets/27975/e1fd0d1e-38a4-4de7-9ef9-35ea3a9fa491)

## Demo

[Demo ↗](https://zedix-prose-editor-element.netlify.app)

## Installation

```
❯ yarn add @zedix/prose-editor-element
```

## Usage

This above global stylesheet is needed because ProseEditor must be in the light DOM (instead of the shadow tree) until these bugs are resolved:

- [Firefox #1496769](https://bugzilla.mozilla.org/show_bug.cgi?id=1496769)
- [WebKit #163921](https://bugs.webkit.org/show_bug.cgi?id=163921)

```css
@import '@zedix/prose-editor/dist/prose-editor.css';
```

```html
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
<script type="module" src="/dist/prose-editor.js"></script>

<zx-prose-editor
  editor-class="prose p-2 min-h-[20rem] focus:outline-none"
  placeholder="Note…"
  initial-html="<p>Hello Editor</p>"
  toolbar-placement="bottom"
  @change="onChange"
></zx-prose-editor>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    document
      .querySelector('zx-prose-editor')
      .addEventListener('change', function (event) {
        console.log('HTML', event.detail.html);
        console.log('JSON', event.detail.json);
      });
  });
</script>
```
