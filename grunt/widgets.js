/*
grunt widgets
    Bundles each overlay component widget into a single self-hosted ESM file.
*/

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WIDGETS_SRC = path.resolve(__dirname, '../src/resources/overlay-widget-components');
const WIDGETS_OUT = path.resolve(__dirname, '../build/resources/overlay-widget-components');

/**
 * Minimal esbuild plugin that compiles .vue files
 * Using this to avoid the overhead of a full Vite setup
 *
 * Scoped styles are injected into the document head at runtime rather
 * than generating as a separate file.
 */
function vueSfcPlugin() {
    const {
        parse,
        compileScript,
        compileTemplate,
        compileStyle,
        rewriteDefault
    } = require('@vue/compiler-sfc');

    return {
        name: 'vue-sfc',
        setup(build) {
            build.onLoad({ filter: /\.vue$/ }, async (args) => {
                const filename = args.path;
                const source = await fs.promises.readFile(filename, 'utf8');
                const { descriptor, errors } = parse(source, { filename });

                if (errors.length) {
                    return { errors: errors.map(e => ({ text: String(e.message ?? e) })) };
                }

                const id = crypto.createHash('sha256').update(filename).digest('hex').slice(0, 8);
                const scopeId = `data-v-${id}`;
                const hasScoped = descriptor.styles.some(s => s.scoped);
                const isTS = (descriptor.scriptSetup?.lang || descriptor.script?.lang) === 'ts';
                const parserPlugins = isTS ? ['typescript'] : [];

                const parts = [];

                // Script
                let compiledScript = null;
                if (descriptor.script || descriptor.scriptSetup) {
                    compiledScript = compileScript(descriptor, { id, inlineTemplate: false });
                    parts.push(rewriteDefault(compiledScript.content, '__sfc__', parserPlugins));
                } else {
                    parts.push('const __sfc__ = {};');
                }

                // Template
                if (descriptor.template) {
                    const compiledTemplate = compileTemplate({
                        id,
                        filename,
                        source: descriptor.template.content,
                        scoped: hasScoped,
                        slotted: descriptor.slotted,
                        compilerOptions: {
                            scopeId: hasScoped ? scopeId : undefined,
                            bindingMetadata: compiledScript ? compiledScript.bindings : undefined
                        }
                    });

                    if (compiledTemplate.errors.length) {
                        return { errors: compiledTemplate.errors.map(e => ({ text: String(e.message ?? e) })) };
                    }

                    // compiler emits "export function render(...)"; strip the export so we can attach it.
                    parts.push(compiledTemplate.code.replace(/\bexport\s+function\s+render\b/, 'function render'));
                    parts.push('__sfc__.render = render;');
                }

                // Styles (compiled, then injected into <head>)
                if (descriptor.styles.length) {
                    let css = '';
                    for (const style of descriptor.styles) {
                        const compiledStyle = compileStyle({
                            id,
                            filename,
                            source: style.content,
                            scoped: style.scoped,
                            preprocessLang: style.lang
                        });
                        if (compiledStyle.errors.length) {
                            return { errors: compiledStyle.errors.map(e => ({ text: String(e.message ?? e) })) };
                        }
                        css += compiledStyle.code;
                    }
                    parts.push(`(function(){
  const __css = ${JSON.stringify(css)};
  if (__css && typeof document !== "undefined" && !document.querySelector('style[data-vue-sfc="${id}"]')) {
    const __el = document.createElement("style");
    __el.setAttribute("data-vue-sfc", ${JSON.stringify(id)});
    __el.textContent = __css;
    document.head.appendChild(__el);
  }
})();`);
                }

                if (hasScoped) {
                    parts.push(`__sfc__.__scopeId = ${JSON.stringify(scopeId)};`);
                }

                parts.push('export default __sfc__;');

                return {
                    contents: parts.join('\n'),
                    loader: isTS ? 'ts' : 'js'
                };
            });
        }
    };
}

function getWidgetEntries() {
    if (!fs.existsSync(WIDGETS_SRC)) {
        return [];
    }
    return fs.readdirSync(WIDGETS_SRC, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => path.join(WIDGETS_SRC, d.name, 'index.ts'))
        .filter(entry => fs.existsSync(entry));
}

module.exports = function (grunt) {
    grunt.registerTask('widgets', 'Bundles overlay component widgets via esbuild', function () {
        const done = this.async();

        const entryPoints = getWidgetEntries();
        if (entryPoints.length === 0) {
            grunt.log.writeln('No overlay component widgets found; skipping.');
            done();
            return;
        }

        const esbuild = require('esbuild');

        esbuild.build({
            entryPoints,
            outbase: WIDGETS_SRC,
            outdir: WIDGETS_OUT,
            bundle: true,
            format: 'esm',
            platform: 'browser',
            target: 'es2020',
            external: ['vue', '@lucide/vue', 'motion-v'],
            minify: true,
            sourcemap: false,
            logLevel: 'info',
            plugins: [vueSfcPlugin()]
        }).then(() => {
            grunt.log.ok(`Bundled ${entryPoints.length} overlay component widget(s).`);
            done();
        }).catch((err) => {
            grunt.log.error('Failed to bundle overlay component widgets.');
            grunt.fail.fatal(err);
            done(err);
        });
    });
};
