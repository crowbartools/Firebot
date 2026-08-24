/*
grunt vite
    Builds the Vue-based browser bundles with Vite:
      - control-deck: a standalone SPA located in /control-deck/
      - overlay-widget-components: one ESM bundle file per widget,
        imported by the overlay. CSS is added to header at runtime so each bundle stays a single file.
*/

'use strict';
const fs = require('fs');
const path = require('path');

const CONTROL_DECK_SRC = path.resolve(__dirname, '../src/resources/control-deck');
const CONTROL_DECK_OUT = path.resolve(__dirname, '../build/resources/control-deck');

const WIDGETS_SRC = path.resolve(__dirname, '../src/resources/overlay-widget-components');
const WIDGETS_OUT = path.resolve(__dirname, '../build/resources/overlay-widget-components');

const WIDGET_EXTERNALS = ['vue', '@lucide/vue', 'motion-v'];

function getWidgetNames() {
    if (!fs.existsSync(WIDGETS_SRC)) {
        return [];
    }
    return fs.readdirSync(WIDGETS_SRC, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .filter(name => fs.existsSync(path.join(WIDGETS_SRC, name, 'index.ts')));
}

async function buildControlDeck() {
    const { build } = await import('vite');
    const vue = (await import('@vitejs/plugin-vue')).default;

    await build({
        configFile: false,
        root: CONTROL_DECK_SRC,
        base: './',
        logLevel: 'info',
        plugins: [vue()],
        build: {
            outDir: CONTROL_DECK_OUT,
            emptyOutDir: true,
            sourcemap: true,
            // larger chunk limit because all lucide icons are included
            chunkSizeWarningLimit: 1500
        }
    });
}

async function buildWidgets(names) {
    const { build } = await import('vite');
    const vue = (await import('@vitejs/plugin-vue')).default;
    const cssInjectedByJs = (await import('vite-plugin-css-injected-by-js')).default;

    for (const name of names) {
        await build({
            configFile: false,
            root: WIDGETS_SRC,
            logLevel: 'warn',
            plugins: [vue(), cssInjectedByJs()],
            build: {
                outDir: path.join(WIDGETS_OUT, name),
                emptyOutDir: true,
                minify: true,
                sourcemap: false,
                cssCodeSplit: false,
                // builds widget in library mode to ensure bundle is a single file (no chunks)
                lib: {
                    entry: path.join(WIDGETS_SRC, name, 'index.ts'),
                    formats: ['es'],
                    fileName: () => 'index.js'
                },
                rollupOptions: {
                    external: WIDGET_EXTERNALS
                }
            }
        });
    }
}

module.exports = function (grunt) {
    grunt.registerTask('vite', 'Builds the control-deck and overlay widget bundles via Vite', function () {
        const done = this.async();
        const widgetNames = getWidgetNames();

        Promise.resolve()
            .then(() => buildControlDeck())
            .then(() => {
                grunt.log.ok('Built control-deck.');
                // shouldn't be possible but just in case
                if (widgetNames.length === 0) {
                    grunt.log.writeln('No overlay component widgets found; skipping.');
                    return;
                }
                return buildWidgets(widgetNames).then(() => {
                    grunt.log.ok(`Bundled ${widgetNames.length} overlay component widget(s).`);
                });
            })
            .then(() => done())
            .catch((err) => {
                grunt.log.error('Vite build failed.');
                grunt.fail.fatal(err);
                done(err);
            });
    });
};
