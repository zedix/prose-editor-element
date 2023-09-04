export default {
  $schema: 'http://json.schemastore.org/prettierrc',
  proseWrap: 'never', // Default: 'preserve'
  singleQuote: true, // Default: false
  overrides: [
    {
      files: 'package*.json',
      options: {
        printWidth: Infinity,
      },
    },
  ],
};
