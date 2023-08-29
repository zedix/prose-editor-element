import type { Preview } from '@storybook/web-components';

import '../src/css/prose-editor.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen', // remove main padding
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
