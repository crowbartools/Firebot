"use strict";

/**
 * Watcher Count Service - Performance monitoring tool for AngularJS
 *
 * Tracks the number of active watchers in the application and provides
 * a real-time display overlay and detailed breakdown by component.
 *
 * ## Quick Start
 * Press Ctrl+Shift+W (or Cmd+Shift+W on Mac) to toggle the display
 *
 * ## Console Commands
 *
 * firebotWatcherCount.start()
 *   Start real-time monitoring with overlay display
 *   Updates every second by default
 *
 * firebotWatcherCount.stop()
 *   Stop monitoring and hide the overlay
 *
 * firebotWatcherCount.toggle()
 *   Toggle monitoring on/off
 *
 * firebotWatcherCount.count()
 *   Get current watcher count (one-time check, no display)
 *   Returns: number
 *
 * firebotWatcherCount.breakdown()
 *   Display detailed breakdown of watchers by element type
 *   Shows top 20 components sorted by total watchers
 *   Returns: array of {element, instances, totalWatchers, avgWatchers}
 *
 * ## Watcher Count Guidelines
 * - < 1,000: ✓ Good - Performance should be smooth
 * - 1,000-2,000: ⚠️ Medium - May experience some lag
 * - > 2,000: ⚠️ High - Likely performance issues
 *
 * ## Example Workflow
 * 1. firebotWatcherCount.start()
 * 2. Navigate to different pages and observe the counter
 * 3. When you find a slow page, run firebotWatcherCount.breakdown()
 * 4. Identify components with high totalWatchers
 * 5. Optimize those components (one-time bindings, caching, etc.)
 *
 * @see /docs/WATCHER_COUNT_UTILITY.md for detailed documentation
 */
(function() {
    angular
        .module("firebotApp")
        .factory("watcherCountService", function() {
            const service = {};

            let monitoringEnabled = false;
            let updateInterval = null;
            let displayElement = null;

            // Count all watchers in the entire application
            function countWatchers() {
                const root = angular.element(document.getElementsByTagName('body'));
                const watchers = [];

                function traverseScopes(element) {
                    angular.forEach(['$scope', '$isolateScope'], function(scopeProperty) {
                        if (element.data && element.data() && element.data().hasOwnProperty(scopeProperty)) {
                            const scope = element.data()[scopeProperty];
                            if (scope && scope.$$watchers) {
                                angular.forEach(scope.$$watchers, function(watcher) {
                                    watchers.push(watcher);
                                });
                            }
                        }
                    });

                    angular.forEach(element.children(), function(childElement) {
                        traverseScopes(angular.element(childElement));
                    });
                }

                traverseScopes(root);
                return watchers.length;
            }

            // Create display element
            function createDisplayElement() {
                if (displayElement) {
                    return;
                }

                displayElement = document.createElement('div');
                displayElement.id = 'watcher-count-display';
                displayElement.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.85);
                    color: #fff;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-family: 'Roboto Mono', monospace;
                    font-size: 14px;
                    z-index: 99999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    border: 2px solid #333;
                    min-width: 150px;
                `;
                document.body.appendChild(displayElement);
            }

            // Update the display
            function updateDisplay() {
                if (!displayElement) {
                    return;
                }

                const count = countWatchers();
                let color = '#4CAF50'; // Green

                if (count > 2000) {
                    color = '#f44336'; // Red
                } else if (count > 1000) {
                    color = '#ff9800'; // Orange
                }

                displayElement.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; color: #aaa;">
                        <i class="fas fa-eye"></i> Watchers
                    </div>
                    <div style="font-size: 24px; color: ${color}; font-weight: bold;">
                        ${count.toLocaleString()}
                    </div>
                    <div style="font-size: 11px; color: #888; margin-top: 5px;">
                        ${count > 2000 ? '⚠️ High' : count > 1000 ? '⚠️ Medium' : '✓ Good'}
                    </div>
                `;
            }

            // Remove display element
            function removeDisplayElement() {
                if (displayElement && displayElement.parentNode) {
                    displayElement.parentNode.removeChild(displayElement);
                    displayElement = null;
                }
            }

            // Start monitoring
            service.startMonitoring = function(intervalMs = 1000) {
                if (monitoringEnabled) {
                    return;
                }

                monitoringEnabled = true;
                createDisplayElement();

                updateDisplay();

                updateInterval = setInterval(function() {
                    updateDisplay();
                }, intervalMs);

                console.log('Watcher monitoring started');
            };

            // Stop monitoring
            service.stopMonitoring = function() {
                if (!monitoringEnabled) {
                    return;
                }

                monitoringEnabled = false;

                if (updateInterval) {
                    clearInterval(updateInterval);
                    updateInterval = null;
                }

                removeDisplayElement();
                console.log('Watcher monitoring stopped');
            };

            // Toggle monitoring
            service.toggleMonitoring = function() {
                if (monitoringEnabled) {
                    service.stopMonitoring();
                } else {
                    service.startMonitoring();
                }
            };

            // Get current count (one-time)
            service.getWatcherCount = function() {
                return countWatchers();
            };

            // Log detailed watcher breakdown by scope
            service.logDetailedBreakdown = function() {
                const root = angular.element(document.getElementsByTagName('body'));
                const scopeWatchers = new Map();

                function traverseScopes(element, depth = 0) {
                    angular.forEach(['$scope', '$isolateScope'], function(scopeProperty) {
                        if (element.data && element.data() && element.data().hasOwnProperty(scopeProperty)) {
                            const scope = element.data()[scopeProperty];
                            if (scope && scope.$$watchers) {
                                const watcherCount = scope.$$watchers.length;
                                if (watcherCount > 0) {
                                    const tagName = element[0] ? element[0].tagName : 'unknown';
                                    const id = element.attr('id') || '';
                                    const classes = element.attr('class') || '';
                                    const idPart = id ? `#${id}` : '';
                                    const classPart = classes ? `.${classes.split(' ')[0]}` : '';
                                    const key = `${tagName}${idPart}${classPart}`;

                                    if (!scopeWatchers.has(key)) {
                                        scopeWatchers.set(key, []);
                                    }
                                    scopeWatchers.get(key).push(watcherCount);
                                }
                            }
                        }
                    });

                    angular.forEach(element.children(), function(childElement) {
                        traverseScopes(angular.element(childElement), depth + 1);
                    });
                }

                traverseScopes(root);

                // Aggregate and sort
                const breakdown = [];
                scopeWatchers.forEach((counts, key) => {
                    const total = counts.reduce((a, b) => a + b, 0);
                    breakdown.push({
                        element: key,
                        instances: counts.length,
                        totalWatchers: total,
                        avgWatchers: Math.round(total / counts.length)
                    });
                });

                breakdown.sort((a, b) => b.totalWatchers - a.totalWatchers);

                console.log('=== Watcher Breakdown by Element ===');
                console.log('Total watchers:', countWatchers());
                console.table(breakdown.slice(0, 20)); // Top 20

                return breakdown;
            };

            service.isMonitoring = function() {
                return monitoringEnabled;
            };

            // Expose to window for console access
            window.firebotWatcherCount = {
                start: () => service.startMonitoring(),
                stop: () => service.stopMonitoring(),
                toggle: () => service.toggleMonitoring(),
                count: () => service.getWatcherCount(),
                breakdown: () => service.logDetailedBreakdown()
            };

            return service;
        });
}());
