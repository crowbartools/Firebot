// Play Sound
// This will take the data that is sent to it from the GUI and render on the overlay.
function playSound(data){
    

	var token = encodeURIComponent(data.resourceToken);
	resourcePath = `http://${window.location.hostname}:7473/resource/${token}`;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var uuid = d.getTime().toString();
	
	let filepath = data.filepath.toLowerCase();
	let mediaType;
	if(filepath.endsWith('mp3')) {
		mediaType = "audio/mpeg";
	} else if(filepath.endsWith('ogg')) {
		mediaType = "audio/ogg";
	} else if(filepath.endsWith('wav')) {
		mediaType = "audio/wav";
	}

	let audioElement = `<audio id="${uuid}" src="${resourcePath}" type="${mediaType}"></audio>`;

	// Throw audio element on page.
	$('#wrapper').append(audioElement);

	let audio = document.getElementById(uuid);
	audio.volume = parseFloat(data.volume);

	audio.oncanplay = () => audio.play();

	audio.onended = () => { 
		$("#" + uuid).remove();
	}
}
