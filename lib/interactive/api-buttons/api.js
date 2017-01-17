const request = require('request');

function ttsQuotes() {
    var chanid = app.auth['channelID'];
    var quotePage = "https://api.scottybot.net/showquotes?chanid=" + chanid + "&output=json";
    request(quotePage, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var items = JSON.parse(body);
            var item = items[Math.floor(Math.random() * items.length)];
            var quoteText = item.quote;
            var quoteText = validator.blacklist(quoteText, /["']/g);
            console.log('Quote: ' + quoteText);
			// Commented out TTS for horror month.
		    // say.speak(quoteText);
            botBroadcast(quoteText);
        } else {
            console.log('Error getting scotty quotes.');
        }
    })
}

function randomAdvice(){
    var url = "http://api.adviceslip.com/advice";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
        var advice = json.slip["advice"];
        try{
            console.log('Advice: '+advice);
            botBroadcast('Advice: '+advice);
        } catch (err){
            randomAdvice();
        }   

	  } else {
		  console.log('Error getting api for joke.');
	  }
	})
}

function randomCat(){
	randomPuppy('catpictures')
		.then(url => {
			try{
				console.log('Random Cat: '+url);
				botBroadcast('Random Cat: '+url);
			} catch (err){
				randomCat();
			}	
	})	
}

function randomDog(){
	randomPuppy('dogpictures')
		.then(url => {
			try{
				console.log('Random Dog: '+url);
				botBroadcast('Random Dog: '+url);
			} catch (err){
				randomDog();
			}	
	})		
}

function randomCatFact(){
	//http://catfacts-api.appspot.com/api/facts
	var url = "http://catfacts-api.appspot.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var factUnclean = json.facts[0];
		var fact = validator.blacklist( factUnclean, /["']/g);
		try{
			console.log('Cat Fact: '+fact);
			botBroadcast('Cat Fact: '+fact);
		} catch (err){
			randomCatFact();
		}		
	  } else {
		  console.log('Error getting cat fact.');
	  }
	})
}

function randomDogFact(){
	//https://dog-api.kinduff.com/api/facts
	var url = "https://dog-api.kinduff.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var factUnclean = json.facts[0];
		var fact = validator.blacklist( factUnclean, /["']/g);
		try{
			console.log('Dog Fact: '+fact);
			botBroadcast('Dog Fact: '+fact);
		} catch (err){
			randomDogFact();
		}		
	  } else {
		  console.log('Error getting dog fact.');
	  }
	})
}

function randomPokemon(){
	//http://pokeapi.co/api/v2/pokemon/NUMBER (811 max)
	var random = Math.floor(Math.random() * 721) + 1;
	var url = "http://pokeapi.co/api/v2/pokemon/"+random+"/";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var name = json.name;
		var nameCap = toTitleCase(name);
		var info = "http://pokemondb.net/pokedex/"+name;
		
		var moveset = json.moves;
		var movedata = moveset[Math.floor(Math.random()*moveset.length)];
		var move = movedata['move'];
		var movename = move.name;
		
		try{
			var text = "I choose you "+nameCap+"! "+nameCap+" used "+movename+"! "+info 
			
			console.log('Pokemon: '+text);
			botBroadcast('Pokemon: '+text);
		} catch (err){
			randomPokemon();
		}		
	  } else {
		  console.log('Error getting pokemon');
	  }
	})
}

function randomAww(){
	randomPuppy('aww')
		.then(url => {
			try{
				console.log('Random Aww: '+url);
				botBroadcast('Random Aww: '+url);
			} catch (err){
				randomAww();
			}	
	})				
}

function numberTrivia(){
	// http://numbersapi.com/random
	var url = "http://numbersapi.com/random";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		console.log('Random Number Trivia:'+body);
        botBroadcast('Number Trivia: '+body);
	  } else {
		  console.log('Error getting number trivia.');
	  }
	})
}