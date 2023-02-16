const path = require('node:path');
const root = path.resolve(__dirname, '../../');
module.exports = {
    content: [
      // absolute path to ui component library
        path.join(root, '/packages/ui/**/*.{js,ts,jsx,tsx}'),

        // relative to the importing tailwind.config.js's path
        './src/pages/**/*.{js,ts,jsx,tsx}',
        './src/components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                slab: {
                    900: "#0A0A0C",
                    700: "#18181B",
                    600: "#27272A"
                }
            }
        },
    },
    plugins: [],
};
