const path = require('path');

module.exports = {
    plugins: {
        autoprefixer: {},
        tailwindcss: {
            config: path.resolve(__dirname, '../tailwindcss/tailwind.config.js')
        }
    }
}