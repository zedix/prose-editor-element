# Prose Editor

Prose Editor is a web component wrapping [TipTap 2](https://www.tiptap.dev/).

## Usage

This above global stylesheet is needed because ProseEditor must be in the light DOM (instead of the shadow tree) until these bugs are resolved:

- [Firefox #1496769](https://bugzilla.mozilla.org/show_bug.cgi?id=1496769)
- [WebKit #163921](https://bugs.webkit.org/show_bug.cgi?id=163921)

```css
@import '@zedix/prose-editor/src/css/prose-editor.css';
```

```html
<script type="module" src="/dist/prose-editor.js"></script>
<prose-editor initial-html="<p>Hello Editor</p>"></prose-editor>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    document
      .querySelector('prose-editor')
      .addEventListener('change', function (event) {
        console.log('HTML', event.detail.html);
        console.log('JSON', event.detail.json);
      });
  });
</script>
```
