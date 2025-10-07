"use strict";

/* global CodeMirror */

(function() {
    angular.module('firebotApp').run(function() {
        if (!window.CodeMirror || !CodeMirror.overlayMode) {
            return;
        }

        CodeMirror.defineMode('firebot-replace-vars', function(_config) {
            return (function() {
                let depth = 0; // bracket depth within args
                let waitingArgsStart = false; // immediately after $handle, before first '['

                function eatHandle(stream) {
                    // assumes '$' consumed
                    if (stream.eat(/[A-Za-z]/)) {
                        stream.eatWhile(/[A-Za-z0-9_]/);
                        waitingArgsStart = (stream.peek() === '[');
                        return 'rv-handle'; // <-- only the $ + handle get bold styling
                    }
                    waitingArgsStart = false;
                    return null;
                }

                return {
                    token: function(stream) {
                        // NEW: reset state at line start (we don't span lines in args)
                        if (stream.sol()) {
                            waitingArgsStart = false;
                            depth = 0;
                        }

                        const ch = stream.peek();

                        // $handle (works anywhere)
                        if (ch === '$') {
                            stream.next();
                            return eatHandle(stream);
                        }

                        // Opening bracket
                        if (ch === '[') {
                            if (waitingArgsStart || depth > 0) {
                                waitingArgsStart = false;
                                stream.next();
                                depth = (depth > 0 ? depth + 1 : 1);
                                const lvl = ((depth - 1) % 6) + 1;
                                return `rv-arg rainbow-bracket rb-${lvl}`; // bracket token (not bold)
                            }
                            stream.next(); // plain text '[' outside var args
                            return null;
                        }

                        // Closing bracket
                        if (ch === ']') {
                            if (depth > 0) {
                                const lvl = ((depth - 1) % 6) + 1;
                                stream.next();
                                depth = Math.max(0, depth - 1);
                                return `rv-arg rainbow-bracket rb-${lvl}`; // bracket token (not bold)
                            }
                            stream.next(); // plain text ']' outside var args
                            return null;
                        }

                        // Inside args: color the content as rv-arg (light styling), but let $, [, ] above handle themselves
                        if (depth > 0) {
                            let consumed = false;
                            while (!stream.eol()) {
                                const p = stream.peek();
                                if (p === '$' || p === '[' || p === ']') {
                                    break;
                                }
                                stream.next();
                                consumed = true;
                            }
                            return consumed ? 'rv-arg' : null;
                        }

                        // Default: fast-forward to next interesting char with no styling
                        while (!stream.eol()) {
                            const p = stream.peek();
                            if (p === '$' || p === '[' || p === ']') {
                                break;
                            }
                            stream.next();
                        }
                        return null;
                    }
                };
            })();
        });
    });


    angular
        .module('firebotApp')
        .component("enhancedVariableInput", {
            bindings: {
                model: "=",
                placeholder: "@?"
            },
            template: `
        <div class="enhanced-var-input">
          <style>
            .cm-var-tooltip {
              position: fixed; max-width: 320px; z-index: 9999;
              background: rgba(20,20,28,0.98); color: #fff;
              padding: 8px 10px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.35);
              font-size: 12px; line-height: 1.3; pointer-events: none;
              transform: translateY(-6px); opacity: 0; transition: opacity .12s ease, transform .12s ease;
            }
            .cm-var-tooltip.visible { opacity: 1; transform: translateY(0); }

            .CodeMirror-hints { max-width: 360px; white-space: normal; }
            .CodeMirror-hint .hint-desc { display:block; opacity:.8; font-size:11px; margin-top:2px; }

            /* Make only $handle bold */
            .CodeMirror .cm-rv-handle { font-weight: 600; }

            /* Optional light styling for arg content (not bold) */
            .CodeMirror .cm-rv-arg { }


            /* Base look for any rainbow bracket token */
            .CodeMirror .cm-rainbow-bracket { font-weight: 700; }

            /* Dark theme palette */
            .CodeMirror .cm-rb-1 { color: #ff6b6b !important; }  /* red    */
            .CodeMirror .cm-rb-2 { color: #ffd166 !important; }  /* amber  */
            .CodeMirror .cm-rb-3 { color: #06d6a0 !important; }  /* green  */
            .CodeMirror .cm-rb-4 { color: #4cc9f0 !important; }  /* blue   */
            .CodeMirror .cm-rb-5 { color: #a78bfa !important; }  /* purple */
            .CodeMirror .cm-rb-6 { color: #f472b6 !important; }  /* pink   */

            /* Light theme palette (tweak to taste) */
            .theme-light .CodeMirror .cm-rb-1 { color: #c81e1e; }
            .theme-light .CodeMirror .cm-rb-2 { color: #a16207; }
            .theme-light .CodeMirror .cm-rb-3 { color: #047857; }
            .theme-light .CodeMirror .cm-rb-4 { color: #075985; }
            .theme-light .CodeMirror .cm-rb-5 { color: #6d28d9; }
            .theme-light .CodeMirror .cm-rb-6 { color: #9d174d; }

          </style>

          <!-- Use ONLY ui-codemirror; passing both *opts and this can clobber callbacks -->
          <div ui-codemirror="$ctrl.cmOptions" ng-model="$ctrl.model"></div>
        </div>
      `,
            controller: function($scope, $element, replaceVariableService) {
                const $ctrl = this;

                /** @type {Array<{handle: string, description: string}>} */
                $ctrl.variables = replaceVariableService.allVariables || [];

                const varMap = Object.create(null);
                for (const v of $ctrl.variables) {
                    if (v && v.handle) {
                        varMap[v.handle.toLowerCase()] = v;
                    }
                }

                let cm = null;
                let tooltipEl = null;
                let lastTooltipKey = null;
                let hoverRaf = null;

                // ---------- Hint provider ----------
                function variableHint(cmInstance) {
                    const cursor = cmInstance.getCursor();
                    const line = cmInstance.getLine(cursor.line);

                    // Find prefix like `$word` ending at cursor
                    let i = cursor.ch - 1;
                    while (i >= 0 && /\w/.test(line.charAt(i))) {
                        i--;
                    }
                    if (line.charAt(i) !== '$') {
                        // Handle just-typed '$'
                        if (line.charAt(cursor.ch - 1) === '$') {
                            i = cursor.ch - 1;
                        } else {
                            return;
                        }
                    }

                    const typed = line.slice(i + 1, cursor.ch).toLowerCase();
                    const list = $ctrl.variables
                        .filter(v => !typed || v.handle.toLowerCase().startsWith(typed))
                        .slice(0, 200)
                        .map(v => ({
                            text: `$${v.handle}`,
                            displayText: `$${v.handle}`,
                            render: function(elt, _data, cur) {
                                const main = document.createElement('div');
                                main.textContent = cur.displayText;
                                const desc = document.createElement('span');
                                desc.className = 'hint-desc';
                                desc.textContent = v.description || '';
                                elt.appendChild(main);
                                if (v.description) {
                                    elt.appendChild(desc);
                                }
                            }
                        }));

                    return {
                        list,
                        from: CodeMirror.Pos(cursor.line, i),
                        to: CodeMirror.Pos(cursor.line, cursor.ch)
                    };
                }

                function shouldTriggerHint(cmInstance, ev) {
                    if (ev.ctrlKey || ev.metaKey || ev.altKey) {
                        return false;
                    }
                    const key = ev.key || '';
                    if (key.length > 1 && key !== 'Backspace' && key !== 'Delete') {
                        return false;
                    }

                    const pos = cmInstance.getCursor();
                    const line = cmInstance.getLine(pos.line);
                    const before = line.slice(0, pos.ch);

                    if (key === '$') {
                        return true;
                    }
                    return /\$[A-Za-z0-9_]*$/.test(before);
                }

                // ---------- Tooltip helpers ----------
                function ensureTooltip() {
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.className = 'cm-var-tooltip';
                        document.body.appendChild(tooltipEl);
                    }
                    return tooltipEl;
                }
                function hideTooltip() {
                    if (tooltipEl) {
                        tooltipEl.classList.remove('visible');
                    }
                    lastTooltipKey = null;
                }
                function showTooltipAt(text, x, y) {
                    const el = ensureTooltip();
                    el.textContent = text;
                    el.style.left = `${Math.max(8, x + 12)}px`;
                    el.style.top = `${Math.max(8, y + 12)}px`;
                    void el.offsetWidth; // reflow
                    el.classList.add('visible');
                }
                function handleHover(ev) {
                    if (!cm) {
                        return;
                    }
                    const pos = cm.coordsChar({ left: ev.clientX, top: ev.clientY }, 'window');
                    const tok = cm.getTokenAt(pos);

                    if (!tok || tok.type !== 'replace-variable') {
                        hideTooltip();
                        return;
                    }
                    const m = /^\$([A-Za-z][A-Za-z0-9_]*)(?:\[.*)?$/.exec(tok.string);
                    if (!m) {
                        return hideTooltip();
                    }

                    const handle = m[1];
                    const info = varMap[handle.toLowerCase()];
                    if (!info || !info.description) {
                        return hideTooltip();
                    }

                    const key = `${handle}:${pos.line}:${tok.start}`;
                    if (key !== lastTooltipKey) {
                        lastTooltipKey = key;
                        showTooltipAt(info.description, ev.clientX, ev.clientY);
                    }
                }
                function throttledHover(ev) {
                    if (hoverRaf) {
                        cancelAnimationFrame(hoverRaf);
                    }
                    hoverRaf = requestAnimationFrame(() => handleHover(ev));
                }

                // ---------- Options ----------
                $ctrl.cmOptions = {
                    mode: 'firebot-replace-vars', // already defined in .run
                    lineWrapping: true,
                    viewportMargin: Infinity,
                    placeholder: $ctrl.placeholder || '', // requires addon/display/placeholder.js
                    theme: 'blackboard',
                    matchBrackets: true,
                    extraKeys: { 'Ctrl-Space': 'autocomplete' },
                    hintOptions: {
                        hint: variableHint,
                        completeSingle: false
                    },

                    onLoad: function(instance) {
                        cm = instance;

                        // Set/refresh placeholder after instance is real
                        cm.setOption('placeholder', $ctrl.placeholder || 'test placeholder');

                        // In case the editor was created before .run executed (or options mutated), force mode now:
                        cm.setOption('mode', 'firebot-replace-vars');

                        // Autocomplete trigger
                        cm.on('keyup', function(inst, ev) {
                            if (!CodeMirror.showHint) {
                                return;
                            } // addon/hint/show-hint.js not loaded
                            if (!shouldTriggerHint(inst, ev)) {
                                return;
                            }
                            inst.showHint({ completeSingle: false, hint: variableHint });
                        });

                        // Tooltip wiring
                        const wrapper = cm.getWrapperElement();
                        wrapper.addEventListener('mousemove', throttledHover);
                        wrapper.addEventListener('mouseleave', hideTooltip);

                        // Cleanup
                        $scope.$on('$destroy', function() {
                            try {
                                wrapper.removeEventListener('mousemove', throttledHover);
                                wrapper.removeEventListener('mouseleave', hideTooltip);
                            } catch (_) {}
                            if (hoverRaf) {
                                cancelAnimationFrame(hoverRaf);
                            }
                            if (tooltipEl && tooltipEl.parentNode) {
                                tooltipEl.parentNode.removeChild(tooltipEl);
                            }
                            tooltipEl = null;
                        });

                        const cmResize = require("cm-resize");
                        cmResize(cm, {
                            minHeight: 200,
                            resizableWidth: false,
                            resizableHeight: true
                        });

                        // Refresh once after first paint to ensure overlay draws
                        setTimeout(() => cm.refresh(), 0);
                    }
                };

                $ctrl.$onInit = function() {
                    // nothing else
                };
            }
        });
})();
