'use strict';

const request = require('request');
const chat = require('../mixer-chat.js');
const randomPuppy = require('random-puppy');
const validator = require('validator');
const requestImageSize = require('request-image-size');
const mediaProcessor = require('./mediaProcessor');
const settings = require('../settings-access').settings;
const logger = require('../../logwrapper');

// Capitalize Name
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Imgur Broken Image Checker
// This checks the imgur image to see if it is 161px wide.
// This is a really weird way of doing it, but imgur is redirect hell and it's hard to get an accurate status code.
// The timeout is there because without it this function seems to fail during spamming.
function imageCheck(url) {
    return new Promise((resolve, reject) => {
        logger.info('Checking image...');
        setTimeout(function() {
            requestImageSize(url)
                .then((size) => {
                    if (size.width === 161) {
                        logger.info('Size is 161, most likely broken image. Retrying');
                        reject('retry');
                    } else {
                        logger.info('Image is good. Showing now.');
                        resolve(true);
                    }
                }, (err) => {
                    logger.error('Error checking image.', err);
                    reject('retry');
                });
        }, 500);
    });
}

function randomAdvice(effect) {
    let url = "http://api.adviceslip.com/advice",
        chatter = effect.chatter;
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let json = JSON.parse(body);
            let advice = json.slip["advice"];
            try {
                logger.info('Advice: ' + advice);
                chat.broadcast(chatter, 'Advice: ' + advice);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending advice to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt connect to the advice API. It may be down.");
        }
    });
}

function randomCat(effect) {
    let chatter = effect.chatter;
    randomPuppy('catpictures')
        .then(url => {
            imageCheck(url)
                .then(() => {
                    try {

                        if (effect.show === "chat" || effect.show === "both") {
                            // Send Chat
                            logger.info('Random Cat: ' + url);
                            chat.broadcast(chatter, 'Random Cat: ' + url);
                        }

                        if (effect.show === "overlay" || effect.show === "both") {
                            // Send image to overlay.
                            let position = effect.position,
                                data = {
                                    "url": url,
                                    "imageType": "url",
                                    "imagePosition": position,
                                    "imageHeight": effect.height,
                                    "imageWidth": effect.width,
                                    "imageDuration": effect.length,
                                    "enterAnimation": effect.enterAnimation,
                                    "exitAnimation": effect.exitAnimation,
                                    "customCoords": effect.customCoords
                                };

                            // Get random location.
                            if (position === "Random") {
                                position = mediaProcessor.getRandomPresetLocation();
                            }

                            if (settings.useOverlayInstances()) {
                                if (effect.overlayInstance != null) {
                                    if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                                        data.overlayInstance = effect.overlayInstance;
                                    }
                                }
                            }

                            renderWindow.webContents.send('showimage', data);
                        }

                    } catch (err) {
                        renderWindow.webContents.send('error', "There was an error sending a cat picture.");
                    }
                }, (error) => {
                    logger.error(error);
                    randomCat(chatter);
                });
        });
}

function randomDog(effect) {
    let chatter = effect.chatter;
    randomPuppy('dogpictures')
        .then(url => {
            imageCheck(url)
                .then(() => {
                    try {

                        if (effect.show === "chat" || effect.show === "both") {
                            // Send Chat
                            logger.info('Random Dog: ' + url);
                            chat.broadcast(chatter, 'Random Dog: ' + url);
                        }

                        if (effect.show === "overlay" || effect.show === "both") {
                            // Send image to overlay.
                            let position = effect.position,
                                data = {
                                    "url": url,
                                    "imageType": "url",
                                    "imagePosition": position,
                                    "imageHeight": effect.height,
                                    "imageWidth": effect.width,
                                    "imageDuration": effect.length,
                                    "enterAnimation": effect.enterAnimation,
                                    "exitAnimation": effect.exitAnimation,
                                    "customCoords": effect.customCoords
                                };

                            // Get random location.
                            if (position === "Random") {
                                position = mediaProcessor.getRandomPresetLocation();
                            }

                            if (settings.useOverlayInstances()) {
                                if (effect.overlayInstance != null) {
                                    if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                                        data.overlayInstance = effect.overlayInstance;
                                    }
                                }
                            }

                            renderWindow.webContents.send('showimage', data);
                        }

                    } catch (err) {
                        renderWindow.webContents.send('error', "There was an error sending a dog picture.");
                    }
                }, (error) => {
                    logger.error(error);
                    randomDog(chatter);
                });
        });
}

function randomCatFact(effect) {
    //http://catfacts-api.appspot.com/api/facts
    let url = "https://catfact.ninja/fact",
        chatter = effect.chatter;
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let json = JSON.parse(body);
            let factUnclean = json.fact;
            let fact = validator.blacklist(factUnclean, /["']/g);
            try {
                logger.info('Cat Fact: ' + fact);
                chat.broadcast(chatter, 'Cat Fact: ' + fact);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending a cat fact to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt connect to the cat fact api. It may be down.");
        }
    });
}

function randomDogFact(effect) {
    //https://dog-api.kinduff.com/api/facts
    let url = "https://dog-api.kinduff.com/api/facts",
        chatter = effect.chatter;
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let json = JSON.parse(body);
            let factUnclean = json.facts[0];
            let fact = validator.blacklist(factUnclean, /["']/g);
            try {
                logger.info('Dog Fact: ' + fact);
                chat.broadcast(chatter, 'Dog Fact: ' + fact);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending a dog fact to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt conenct to the dog fact api. It may be down.");
        }
    });
}

function randomPokemon(effect) {
    //http://pokeapi.co/api/v2/pokemon/NUMBER (811 max)
    let random = Math.floor(Math.random() * 721) + 1,
        url = "http://pokeapi.co/api/v2/pokemon/" + random + "/",
        chatter = effect.chatter;
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let json = JSON.parse(body);
            let name = json.name;
            let nameCap = toTitleCase(name);
            let info = "http://pokemondb.net/pokedex/" + name;

            let moveset = json.moves;
            let movedata = moveset[Math.floor(Math.random() * moveset.length)];
            let move = movedata['move'];
            let movename = move.name;

            try {
                let text = "I choose you " + nameCap + "! " + nameCap + " used " + movename + "! " + info;

                logger.info('Pokemon: ' + text);
                chat.broadcast(chatter, 'Pokemon: ' + text);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending a pokemon to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt hit the pokemon api. It may be down.");
        }
    });
}

function randomAww(effect) {
    let chatter = effect.chatter;
    randomPuppy('aww')
        .then(url => {
            imageCheck(url)
                .then(() => {
                    try {

                        if (effect.show === "chat" || effect.show === "both") {
                            // Send Chat
                            logger.info('Random Aww: ' + url);
                            chat.broadcast(chatter, 'Random Aww: ' + url);
                        }

                        if (effect.show === "overlay" || effect.show === "both") {
                            // Send image to overlay.
                            let position = effect.position,
                                data = {
                                    "url": url,
                                    "imageType": "url",
                                    "imagePosition": position,
                                    "imageHeight": effect.height,
                                    "imageWidth": effect.width,
                                    "imageDuration": effect.length,
                                    "enterAnimation": effect.enterAnimation,
                                    "exitAnimation": effect.exitAnimation,
                                    "customCoords": effect.customCoords
                                };

                            // Get random location.
                            if (position === "Random") {
                                position = mediaProcessor.getRandomPresetLocation();
                            }

                            if (settings.useOverlayInstances()) {
                                if (effect.overlayInstance != null) {
                                    if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                                        data.overlayInstance = effect.overlayInstance;
                                    }
                                }
                            }

                            renderWindow.webContents.send('showimage', data);
                        }

                    } catch (err) {
                        renderWindow.webContents.send('error', "There was an error sending aww picture.");
                    }
                }, (error) => {
                    logger.error(error);
                    randomAww(chatter);
                });
        });
}

function numberTrivia(effect) {
    // http://numbersapi.com/random
    let url = "http://numbersapi.com/random",
        chatter = effect.chatter;
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                logger.info('Random Number Trivia:' + body);
                chat.broadcast(chatter, 'Number Trivia: ' + body);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending number trivia to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt connect to the number trivia api. It may be down.");
        }
    });
}

function dadJoke(effect) {
    let options = {
            url: "https://icanhazdadjoke.com/",
            headers: {
                'Accept': "Application/json",
                'User-Agent': "Firebot Mixer Interactive - (https://crowbartools.com/firebot) - @firebotapp"
            }
        },
        chatter = effect.chatter;
    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let json = JSON.parse(body);
            let joke = json.joke;
            try {
                logger.info('Dad Joke: ' + joke);
                chat.broadcast(chatter, 'Dad Joke: ' + joke);
            } catch (err) {
                renderWindow.webContents.send('error', "There was an error sending dad joke to chat.");
            }
        } else {
            renderWindow.webContents.send('error', "I couldnt connect to the dad joke API. It may be down.");
        }
    });
}

// API Processor
// This takes the packet, figures out the type, and then the the api function.
function apiProcessor(effect) {
    let apiType = effect.api;

    // Do something based on api type.
    if (apiType === "Advice") {
        randomAdvice(effect);
    } else if (apiType === "Cat Picture") {
        randomCat(effect);
    } else if (apiType === "Cat Fact") {
        randomCatFact(effect);
    } else if (apiType === "Dog Picture") {
        randomDog(effect);
    } else if (apiType === "Dog Fact") {
        randomDogFact(effect);
    } else if (apiType === "Aww") {
        randomAww(effect);
    } else if (apiType === "Pokemon") {
        randomPokemon(effect);
    } else if (apiType === "Number Trivia") {
        numberTrivia(effect);
    } else if (apiType === "Dad Joke") {
        dadJoke(effect);
    }
}

// Export Functions
exports.go = apiProcessor;
