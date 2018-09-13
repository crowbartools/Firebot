'use strict';
(function(angular) {

    let module = angular.module('slidingPuzzle', []);

    /**
     * Service
     */
    module.factory('slidingPuzzle', function() {
        function shuffle(a) {

            for (let j, x, i = a.length; i; i -= 1) {
                j = parseInt(Math.random() * i, 10);
                x = a[i - 1];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        }

        function SlidingPuzzle(rows, cols) {
            /**
             * Puzzle grid
             * @type {Array}
             */
            this.grid = [];

            /**
             * Moves count
             * @type {Number}
             */
            this.moves = 0;

            /**
             * Moves tile
             * @param srow
             * @param scol
             */
            this.move = function(srow, scol) {
                let dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]],
                    tref, trow, tcol;

                for (let d = 0; d < dirs.length; d++) {
                    trow = srow + dirs[d][0];
                    tcol = scol + dirs[d][1];
                    if (this.grid[trow] && this.grid[trow][tcol] && this.grid[trow][tcol].empty) {
                        tref = this.grid[srow][scol];
                        this.grid[srow][scol] = this.grid[trow][tcol];
                        this.grid[trow][tcol] = tref;
                        this.moves++;
                    }
                }
            };

            /**
             * Shuffles grid
             */
            this.shuffle = function() {
                let tiles = [];
                this.traverse(function(tile) {
                    tiles.push(tile);
                });
                shuffle(tiles);
                this.traverse(function(tile, row, col) {
                    this.grid[row][col] = tiles.shift();
                });
                this.moves = 0;
            };

            /**
             * Solves puzzle
             */
            this.solve = function() {
                let tiles = [];
                this.traverse(function(tile) {
                    tiles.push(tile);
                });
                tiles.sort(function(x, y) {
                    return (x.id - y.id);
                });
                this.traverse(function(tile, row, col) {
                    this.grid[row][col] = tiles.shift();
                });
            };

            /**
             * Is solved?
             * @type {Boolean}
             */
            this.isSolved = function() {
                let id = 1;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (this.grid[row][col].id !== id++) {
                            return false;
                        }
                    }
                }
                return true;
            };

            /**
             * Traverses grid and executes fn on every tile
             * @param fn
             */
            this.traverse = function(fn) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        fn.call(this, this.grid && this.grid[row] ? this.grid[row][col] : undefined, row, col);
                    }
                }
            };

            // initialize grid
            let id = 1;
            this.traverse(function(tile, row, col) {
                if (!this.grid[row]) {
                    this.grid[row] = [];
                }
                this.grid[row][col] = {
                    id: id++,
                    empty: (row === rows - 1) && (col === cols - 1)
                };
                if (this.grid[row][col].empty) {
                    this.empty = this.grid[row][col];
                }
            });
        }

        return function(rows, cols) {
            return new SlidingPuzzle(rows, cols);
        };
    });

    /**
     * Directive
     */
    module.directive('slidingPuzzle', function(slidingPuzzle) {
        return {
            restrict: 'EA',
            replace: true,
            template: '<table class="sliding-puzzle" ng-class="{\'puzzle-solved\': puzzle.isSolved()}">' +
                '<tr ng-repeat="($row, row) in puzzle.grid">' +
                '<td ng-repeat="($col, tile) in row" ng-click="puzzle.move($row, $col)" ng-style="tile.style" ng-class="{\'puzzle-empty\': tile.empty}" title="{{tile.id}}"></td>' +
                '</tr>' +
                '</table>',
            scope: {
                size: '@',
                src: '@',
                api: '='
            },
            link: function(scope, element, attrs) {
                let rows, cols,
                    loading = true,
                    image = new Image();

                function create() {
                    scope.puzzle = slidingPuzzle(rows, cols);

                    if (attrs.api) {
                        scope.api = scope.puzzle;
                    }

                    tile(); // eslint-disable-line no-use-before-define
                }

                function tile() {
                    if (loading) {
                        return;
                    }

                    let width = image.width / cols,
                        height = image.height / rows;

                    scope.puzzle.traverse(function(tile, row, col) {
                        tile.style = {
                            width: width + 'px',
                            height: height + 'px',
                            background: (tile.empty ? 'none' : "url('" + scope.src + "') no-repeat -" + (col * width) + 'px -' + (row * height) + 'px')
                        };
                    });

                    scope.puzzle.shuffle();
                }

                attrs.$observe('size', function(size) {
                    size = size.split('x');
                    if (size[0] >= 2 && size[1] >= 2) {
                        rows = size[0];
                        cols = size[1];
                        create();
                    }
                });

                attrs.$observe('src', function(src) {
                    loading = true;
                    image.src = src;
                    image.onload = function() {
                        loading = false;
                        scope.$apply(function() {
                            tile();
                        });
                    };
                });
            }
        };
    });
}(window.angular));