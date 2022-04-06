const { merge } = require('./build.js');

module.exports = [
    merge({

        // relative to /src/
        dir: './main/',

        // relative to /src/<dir>/
        entry: './main.ts',
        target: 'electron-main'
    }),
    merge({

        // relative to /src/
        dir: './preload/',

        // relative to /src/<dir>/
        entry: './preload.ts',
        target: 'electron-preload'
    })
];