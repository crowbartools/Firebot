const path = require('node:path');
const root = path.resolve(__dirname, '../../');
const defaultTheme = require('tailwindcss/defaultTheme');

const FIREBOT_BRAND_COLORS = {
    "maximum-blue-green": '#4BBABC',
    "fire-opal": '#D63837',
    "pear": '#D2D50D',
    "sunglow": '#FFBE00',
    "aero": '#5FA1D9',
    "honolulu": '#005B9F',
    "rich-black": '#071018'
}

// slab: {
//     900: "#0A0A0C",
//     700: "#18181B",
//     600: "#27272A"
// }

/** @type {import('tailwindcss').Config} */
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
                firebot: {
                    ...FIREBOT_BRAND_COLORS,
                }
            },
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    safelist: [
        'snow',
        'slate',
    ],
    plugins: [
        require('tailwind-scrollbar'),
        require('tailwindcss-themer')({
            // "Shadow" theme
            defaultTheme: {
                extend: {
                    colors: {
                        "primary-bg": "#0A0A0C",
                        "secondary-bg": "#18181B",
                        "tertiary-bg": "#313137",
                        "primary-text": "#D4D4D8",
                        "muted-text": "#bdbdbf",
                    },
                }
            },
            themes: [
                {
                    name: "slate",
                    extend: {
                        colors: {
                            "primary-bg": "#27272A",
                            "secondary-bg": "#36393F",
                            "primary-text": "#D4D4D8",
                            "muted-text": "#bdbdbf",
                        }
                    }
                },
                {
                    name: "snow",
                    extend: {
                        colors: {
                            "primary-bg": "#FFFFFF",
                            "secondary-bg": "#D4D4D8",
                            "primary-text": "black",
                            "muted-text": "#374151",
                        }
                    }
                },
            ]
        })
    ],
};
