// Screen
function screenProgress(screen) {
    if(screen !== "" && screen !== undefined){
        var json = [];
        var screen = screen[0]
        var rawid = screen.id;
        var mean = screen.coordMean;

        if ( isNaN(mean.x) == true && isNaN(mean.y) == true){
            // screen controls not getting input
        } else {
            var screenX = mean.x;
            var screenY = mean.y;
        }

        var clicks = screen.clicks;

        if (clicks > 0) {
            json.push({
                "id": rawid,
                "clicks": [{
                    "coordinate": mean,
                    "intensity": 1
                }]
            });
        }
        return json;
    } else {
		return [];
	}
}


exports.update = screenProgress;