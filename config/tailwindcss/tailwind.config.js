/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/**/*.{js,jsx,ts,tsx}",
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
        }
    }
};