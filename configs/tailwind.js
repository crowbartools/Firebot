const colors = require("tailwindcss/colors");

module.exports = {
    purge: [],
    theme: {
        extend: {
            colors: {
                gray: colors.gray,
            },
        },
        fontFamily: {
            base: ['"Open Sans"'],
            secondary: ['"Roboto"'],
            tertiary: ['"Quicksand'],
        },
    },
    variants: {},
    plugins: [require("@tailwindcss/forms")],
};
