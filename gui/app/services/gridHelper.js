"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("gridHelper", function(logger) {
            let service = {};

            function buildObstructionsMap(tiles) {
                let obstructions = {};
                for (let tile of tiles) {
                    let tileX1 = tile.x,
                        tileY1 = tile.y,
                        tileX2 = tile.x + tile.width,
                        tileY2 = tile.y + tile.height;

                    for (let y = tileY1; y < tileY2; y++) {
                        for (let x = tileX1; x < tileX2; x++) {
                            obstructions[`${x}${y}`] = true;
                        }
                    }
                }
                return obstructions;
            }


            /*function cellIsObstructed(x, y) {
                for (let tile of $scope.tiles) {
                    let tileX1 = tile.x,
                        tileY1 = tile.y,
                        tileX2 = tile.x + tile.width,
                        tileY2 = tile.y + tile.height;

                    if (x > tileX1 && y > tileY1 && x < tileX2 && y < tileY2) {
                        return true;
                    }
                }
                return false;
            }*/

            function areaIsObstructed(startingX, startingY, areaWidth, areaHeight, obstructions) {
                let shiftedWidth = startingX + areaWidth,
                    shiftedHeight = startingY + areaHeight;
                for (let y = startingY; y < shiftedHeight; y++) {
                    for (let x = startingX; x < shiftedWidth; x++) {
                        let isObstructed = obstructions[`${x}${y}`];
                        if (isObstructed) return true;
                    }
                }
                return false;
            }

            service.findOpenArea = function(gridWidth, gridHeight, areaWidth, areaHeight, currentTiles = []) {

                let obstructions = buildObstructionsMap(currentTiles);

                for (let y = 0; y < gridHeight; y++) {
                    if (y + areaHeight > gridHeight) {
                        // impossible to have enough room at this point
                        break;
                    }
                    for (let x = 0; x < gridWidth; x++) {
                        if (x + areaWidth > gridWidth) {
                            // impossible to have enough room on this row.
                            break;
                        }

                        let areaObstructed = areaIsObstructed(x, y, areaWidth, areaHeight, obstructions);

                        if (!areaObstructed) {
                            return { x: x, y: y};
                        }
                    }
                }
                return null;
            };

            service.GridSize = {
                SMALL: "small",
                MEDIUM: "medium",
                LARGE: "large"
            };

            service.GridSizes = {
                small: {
                    width: 30,
                    height: 40
                },
                medium: {
                    width: 45,
                    height: 25
                },
                large: {
                    width: 80,
                    height: 20
                }
            };

            service.currentGridSize = service.GridSize.LARGE;

            return service;
        });
}());
