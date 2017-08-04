// Show HTML
// This will take the data that is sent to it from the GUI and render on the overlay.
function showHtml(data){
	// HTML Packet...
	// {"event":"html","html": HTML, "length": length, "removal": removal}
    var HTML = data.html;
    var length = parseInt(data.length) * 1000;
    var mainClass = data.removal;

	// Throw HTML on page.
	$('#wrapper').append(HTML);

	// In X time remove it.
	setTimeout(function(){ 
		$('.'+mainClass).fadeOut('fast', function(){
			$('.'+mainClass).remove();
		});
	}, length);
}
