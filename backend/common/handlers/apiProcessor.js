"use strict";

const axios = require("axios");
const logger = require("../../logwrapper");

// Capitalize Name
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

async function randomAdvice() {
    let url = "http://api.adviceslip.com/advice";

    return await axios.get(url)
        .then(function(response) {
            let advice = response.data.slip["advice"];
            logger.info("Advice: " + advice);
            return advice;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "Couldnt connect to the advice API. It may be down."
            );
            return "[Error getting API response]";
        });
}

async function randomCatFact() {
    //http://catfacts-api.appspot.com/api/facts
    let url = "https://catfact.ninja/fact";

    return await axios.get(url)
        .then(function(response) {
            let fact = response.data.fact;
            logger.info("Cat Fact: " + fact);
            return fact;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "There was an error sending a cat fact to chat."
            );
            return "[Error getting API response]";
        });
}

async function randomDogFact() {
    //https://dog-api.kinduff.com/api/facts
    let url = "https://dog-api.kinduff.com/api/facts";

    return await axios.get(url)
        .then(function(response) {
            let fact = response.data.facts[0];
            logger.info("Dog Fact: " + fact);
            return fact;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "Couldnt conenct to the dog fact api. It may be down."
            );
            return "[Error getting API response]";
        });
}

async function randomPokemon() {
    //http://pokeapi.co/api/v2/pokemon/NUMBER (811 max)
    let random = Math.floor(Math.random() * 721) + 1,
        url = "http://pokeapi.co/api/v2/pokemon/" + random + "/";

    return await axios.get(url)
        .then(function(response) {
            let name = response.data.name;
            let nameCap = toTitleCase(name);
            let info = "http://pokemondb.net/pokedex/" + name;

            let moveset = response.data.moves;
            let movedata = moveset[Math.floor(Math.random() * moveset.length)];
            let move = movedata["move"];
            let movename = move.name;
            let text = "I choose you " + nameCap + "! " + nameCap + " used " + movename + "! " + info;

            logger.info("Pokemon: " + text);
            return text;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "Couldnt connect to the pokemon api. It may be down."
            );
            return "[Error getting API response]";
        });
}

async function numberTrivia() {
    // http://numbersapi.com/random
    let url = "http://numbersapi.com/random";

    return await axios.get(url)
        .then(function(response) {
            logger.info("Random Number Trivia:" + response.data);
            return response.data;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "Couldnt connect to the number trivia api. It may be down."
            );
            return "[Error getting API response]";
        });
}

async function dadJoke() {
    let options = {
        url: "https://icanhazdadjoke.com/",
        headers: {
            'Accept': "Application/json",
            'User-Agent': "Firebot - (https://firebot.app) - @firebotapp"
        }
    };

    return await axios.get(options.url, options)
        .then(function(response) {
            let joke = response.data.joke;
            logger.info("Dad Joke: " + joke);
            return joke;
        })
        .catch(function(err) {
            logger.debug(err);
            renderWindow.webContents.send(
                "error",
                "Couldnt connect to the dad joke API. It may be down."
            );
            return "[Error getting API response]";
        });
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
