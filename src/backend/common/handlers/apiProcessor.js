"use strict";

const logger = require("../../logwrapper");
const frontendCommunicator = require("../frontend-communicator");

// Capitalize Name
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

async function randomAdvice() {
    const url = "http://api.adviceslip.com/advice";
    try {
        const response = await fetch(url);
        const advice = (await response.json()).slip["advice"];
        logger.info(`Advice: ${advice}`);
        return advice;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "Couldn't connect to the advice API. It may be down."
        );
        return "[Error getting API response]";
    }
}

async function randomCatFact() {
    //http://catfacts-api.appspot.com/api/facts
    const url = "https://catfact.ninja/fact";

    try {
        const response = await fetch(url);
        const fact = (await response.json()).fact;
        logger.info(`Cat Fact: ${fact}`);
        return fact;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "There was an error sending a cat fact to chat."
        );
        return "[Error getting API response]";
    }
}

async function randomDogFact() {
    //https://dog-api.kinduff.com/api/facts
    const url = "https://dog-api.kinduff.com/api/facts";

    try {
        const response = await fetch(url);
        const fact = (await response.json()).facts[0];
        logger.info(`Dog Fact: ${fact}`);
        return fact;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "Couldn't connect to the dog fact API. It may be down."
        );
        return "[Error getting API response]";
    }
}

async function randomPokemon() {
    const random = Math.floor(Math.random() * 1025) + 1,
        url = `https://pokeapi.co/api/v2/pokemon/${random}/`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const name = data.name;
        const nameCap = toTitleCase(name);
        const info = `https://pokemondb.net/pokedex/${name}`;

        const moveset = data.moves;
        const movedata = moveset[Math.floor(Math.random() * moveset.length)];
        const move = movedata["move"];
        const movename = move.name;
        const text = `I choose you ${nameCap}! ${nameCap} used ${movename}! ${info}`;

        logger.info(`Pokemon: ${text}`);
        return text;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "Couldn't connect to the Pokemon API. It may be down."
        );
        return "[Error getting API response]";
    }
}

async function numberTrivia() {
    // http://numbersapi.com/random
    const url = "http://numbersapi.com/random";

    try {
        const response = await fetch(url);
        const data = await response.text();
        logger.info(`Random Number Trivia: ${data}`);
        return data;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "Couldn't connect to the number trivia API. It may be down."
        );
        return "[Error getting API response]";
    }
}

async function dadJoke() {
    const options = {
        url: "https://icanhazdadjoke.com/",
        headers: {
            "Accept": "Application/json",
            "User-Agent": "Firebot - (https://firebot.app) - @firebotapp"
        }
    };

    try {
        const response = await fetch(options.url, options);
        const joke = (await response.json()).joke;
        logger.info(`Dad Joke: ${joke}`);
        return joke;
    } catch (err) {
        logger.debug(err.message);
        frontendCommunicator.send(
            "error",
            "Couldn't connect to the dad joke API. It may be down."
        );
        return "[Error getting API response]";
    }
}

// API Processor
async function apiProcessor(apiType) {
    let apiResponse = "[Error getting API response]";

    if (apiType === "Advice") {
        apiResponse = await randomAdvice();
    } else if (apiType === "Cat Fact") {
        apiResponse = await randomCatFact();
    } else if (apiType === "Dog Fact") {
        apiResponse = await randomDogFact();
    } else if (apiType === "Pokemon") {
        apiResponse = await randomPokemon();
    } else if (apiType === "Number Trivia") {
        apiResponse = await numberTrivia();
    } else if (apiType === "Dad Joke") {
        apiResponse = await dadJoke();
    }

    return apiResponse;
}

// Export Functions
exports.getApiResponse = apiProcessor;