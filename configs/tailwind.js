const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    purge: [],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter var", ...defaultTheme.fontFamily.sans]
            },
            colors: {
                "blue-gray": colors.blueGray,
                "cool-gray": colors.coolGray,
                "true-gray": colors.trueGray
            }
        },
    },
    variants: {},
    plugins: [require("@tailwindcss/forms")]
};
