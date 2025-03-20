/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Add autoprefixer for vendor prefixing
    "postcss-import": {}, // Add support for importing CSS files
    "postcss-nested": {}, // Add support for nesting CSS rules
  },
};

export default config;
