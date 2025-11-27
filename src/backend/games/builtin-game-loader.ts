import { GameManager } from "./game-manager";

import bidGame from "./builtin/bid/bid";
import heistGame from "./builtin/heist/heist";
import slotsGame from "./builtin/slots/slots";
import triviaGame from "./builtin/trivia/trivia";

const defaultGames = [
    bidGame,
    heistGame,
    slotsGame,
    triviaGame
];

function loadGames() {
    for (const game of defaultGames) {
        GameManager.registerGame(game);
    }
};

export = { loadGames };