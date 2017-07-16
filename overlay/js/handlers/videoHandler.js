// Load youtube iframe api onto page.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Video Handling
// This will take the data that is sent to it from the GUI and render a video on the overlay.
function showVideo(data){
	// Video Packet...
	// {"event":"video","filepath":filepath, "videoX":videoX, "videoY":videoY, "videoDuration":videoDuration};
	var videoType = data.videoType;
	var filepath = data.filepath;
	var youtubeId = data.youtubeId;
	var filepathNew = filepath.replace(/\\/g,"/");
	var videoPosition = data.videoPosition;
	var videoHeight = data.videoHeight;
	var videoWidth = data.videoWidth;
	var videoDuration = parseInt(data.videoDuration) * 1000;
	var videoVolume = data.videoVolume;
	var videoStarttime = data.videoStarttime || 0;
	
	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if(videoType === "Local Video"){

		if (videoHeight === false && videoWidth === false){
			// Both height and width fields left blank.
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else if (videoWidth === false){
			// Width field left blank, but height provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; height:'+ videoHeight +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video height="'+ videoHeight +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else if (videoHeight === false) {
			// Height field left blank, but width provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; width:'+ videoWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video width="'+ videoWidth +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		} else {
			// Both height and width provided.
			// var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none; height:'+ videoHeight +'px; width:'+ imageWidth +'px;"><img src="'+filepathNew+'?time='+divClass+'" style="max-width:100%; max-height:100%;"></div>';
			var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><video height="'+ videoHeight +'" width="'+ videoWidth +'" class="player" autoplay ><source  src="'+filepathNew+'?time='+divClass+'" type="video/mp4" ></video></div>';
		}

		// Put the div on the page.
		$('#wrapper').append(videoFinal);
		$('.'+divClass+'-video').fadeIn('fast');

		// Adjust volume
		videoVolume = parseInt(videoVolume) / 10;
		console.log(videoVolume);
		$('.player').prop("volume", videoVolume);

		// Remove div after X time.
		setTimeout(function(){ 
			$('.'+divClass+'-video').fadeOut('fast', function(){
				$('.'+divClass+'-video').remove();
			});
		}, videoDuration);
		
	}else{
		var videoFinal = '<div class="'+divClass+'-video videoOverlay" position="'+videoPosition+'" style="display:none;"><div id="player"></div></div>';
		
		// Throw div on page.
		$('#wrapper').append(videoFinal);
		
		// Add iframe.
		var player = new YT.Player('player', {
			videoId: youtubeId,
			playerVars: { 
				'autoplay': 1, 
				'controls': 0,
				'start': videoStarttime,
				'showinfo': 0,
				'rel': 0,
				'modestbranding': 1
			},
			events: {
				'onReady': onPlayerReady,
				'onError': onPlayerError
			}
		});

		// Fade in video.
		$('.'+divClass+'-video').fadeIn('fast');

		// Play video when the player is ready.
		function onPlayerReady(event) {
			event.target.setVolume(parseInt(videoVolume) * 10);
			event.target.playVideo();
		}

		// Remove div after X time.
		setTimeout(function(){ 
			$('.'+divClass+'-video').fadeOut('fast', function(){
				$('.'+divClass+'-video').remove();
			});
		}, videoDuration);

		// Log Errors
		function onPlayerError(event){
			console.log(event)
		}
	}
};