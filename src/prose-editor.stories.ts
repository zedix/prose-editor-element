import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './prose-editor';

type Story = StoryObj;

const meta: Meta = {
  title: 'Custom Elements/prose-editor',
  component: 'prose-editor',
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
    },
    'toolbar-placement': {
      control: 'select',
      options: ['top', 'bottom'],
    },
    'toolbar-preset': {
      control: 'select',
      options: ['default', 'minimal'],
    },
  },
  args: {
    theme: 'light',
  },
};

const onEditorChange = (event: CustomEvent) => {
  const editor = event.target as HTMLElement;
  editor.parentNode!.querySelector('.content-html')!.textContent =
    event.detail.html;
  editor.parentNode!.querySelector('.content-json')!.textContent =
    JSON.stringify(event.detail.json, null, 2);
};

export const Showcase: Story = {
  args: {
    toolbar: [],
    'toolbar-preset': 'default',
    'toolbar-placement': 'bottom',
    placeholder: 'Type here…',
    disabled: false,
  },
  render: (args: any) => html`
    <div class="grid bg-gray-50">
      <zx-prose-editor
        style="--theme: ${args.theme}"
        class="m-4"
        .initialHtml="${'<p><strong>Hello</strong></p>'}"
        .disabled="${args.disabled}"
        .toolbar="${args['toolbar']}"
        toolbar-preset="${args['toolbar-preset']}"
        toolbar-placement="${args['toolbar-placement']}"
        placeholder="${args.placeholder}"
        editor-class="prose p-2 min-h-[10rem] focus:outline-none"
        @change="${onEditorChange}"
      ></zx-prose-editor>

      <div class="grid gap-4 my-8 p-4 h-full">
        <div>
          <div class="font-bold">HTML</div>
          <pre class="content-html p-4 bg-gray-600 text-white rounded"></pre>
        </div>
        <div>
          <div class="font-bold">JSON</div>
          <pre class="content-json p-4 bg-gray-600 text-white rounded"></pre>
        </div>
      </div>
    </div>
  `,
};

export default meta;
