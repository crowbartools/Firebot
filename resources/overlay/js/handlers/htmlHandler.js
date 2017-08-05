// Show HTML
// This will take the data that is sent to it from the GUI and render on the overlay.
function showHtml(data){
	// HTML Packet...
	// {"event":"html","html": HTML, "length": length, "removal": removal}
    var HTML = data.html;
    var length = parseInt(data.length) * 1000;
    var mainClass = data.removal;
    
    var exitAnimation = data.exitAnimation ? data.exitAnimation : "fadeOut";

	// Throw HTML on page.
	$('#wrapper').append(HTML);

	// In X time remove it.
	setTimeout(function(){ 
		$('.'+mainClass).animateCss(exitAnimation, function(){
			$('.'+mainClass).remove();
		});
	}, length);
}
