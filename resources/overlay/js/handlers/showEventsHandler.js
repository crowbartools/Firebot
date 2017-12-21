// Show Text Replace
// This will animate out any showing effects before showing the next one.
// Note that if there is a lot of spam this will drop many inputs.
function showEventsElementReplace(enterAnimation, exitAnimation, duration, textFinal) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
    
    // Animate old showEvents message off of the page.
    if ( $('.showEventsMessage').length > 0 ){
        $('.showEventsMessage').animateCss(exitAnimation, () => {
            // Remove old message.
            $('.showEventsMessage').remove();
            $('.showEventsHolder').append(textFinal);
    
            // Add in new message and remove it after max duration
            $('.showEventsMessage').animateCss(enterAnimation, () => {
                setTimeout(function(){ 
                    $('.showEventsMessage').animateCss(exitAnimation, () => {
                        $('.showEventsMessage').remove();
                    });
                }, (duration === 0 || duration != null) ? duration : 5000);
            });
        });
    } else {
        $('.showEventsHolder').append(textFinal);
        
        // Add in new message and remove it after max duration
        $('.showEventsMessage').animateCss(enterAnimation, () => {
            setTimeout(function(){ 
                $('.showEventsMessage').animateCss(exitAnimation, () => {
                    $('.showEventsMessage').remove();
                });
            }, (duration === 0 || duration != null) ? duration : 5000);
        });
    }
}

// Show Text Animation
// This will add the text element to the bottom of the list.
// This should be able to keep up with spam fine and works similar to most chat overlays.
function showEventsElementList(enterAnimation, exitAnimation, duration, textFinal, divClass) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
    
    // Animate old showEvents message off of the page.
    $('.showEventsHolder').append(textFinal);
    
    // Add in new message and remove it after max duration
    $('.'+divClass).animateCss(enterAnimation, () => {
        setTimeout(function(){ 
            $('.'+divClass).animateCss(exitAnimation, () => {
                $('.'+divClass).remove();
            });
        }, (duration === 0 || duration != null) ? duration : 5000);
    });
}


// Show Text Handling
// This will take the data that is sent to it from the GUI and push some text to the overlay.
function showEvents(data){
    var showEventsText = data.showEventsText;
    var showEventsColor = data.showEventsColor;
    var showEventsBackgroundColor = data.showEventsBackgroundColor;
    var showEventsFontSize = data.showEventsFontSize;
	var showEventsPosition = data.showEventsPosition;
	var showEventsHeight = data.showEventsHeight;
	var showEventsWidth = data.showEventsWidth;
    var showEventsDuration = parseFloat(data.showEventsDuration) * 1000;
    var showEventsType = data.showEventsType;
    var showEventsAlignment = data.showEventsAlignment;
	
	
	var customPosStyles = "";
	if(showEventsPosition == 'Custom') {
		customPosStyles = getStylesForCustomCoords(data.customCoords)
    }
    

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

    // Add in our showEvents wrapper if it's not added already.
    // This container can have a set width and height and holds all of the showEvents messages.
    if($('.showEventsOverlay').width() !== showEventsWidth || $('.showEventsOverlay').height() !== showEventsHeight || $('.showEventsOverlay').attr('position') !== showEventsPosition){
        $('.showEventsOverlay').remove();

        if (showEventsHeight == false && showEventsWidth == false){
            // Both height and width fields left blank.
            var showEventsFinal = '<div class="showEventsOverlay" position="'+showEventsPosition+'" style="display:block;'+customPosStyles+'"><div class="showEventsHolder"></div></div>';
        } else if (showEventsWidth == false){
            // Width field left blank, but height provided.
            var showEventsFinal = '<div class="showEventsOverlay" position="'+showEventsPosition+'" style="display:block;height:'+ showEventsHeight +'px;'+customPosStyles+'"><div class="showEventsHolder"></div></div>';
        } else if (showEventsHeight == false) {
            // Height field left blank, but width provided.
            var showEventsFinal = '<div class="showEventsOverlay" position="'+showEventsPosition+'" style="display:block;width:'+ showEventsWidth +'px;height:100%;'+customPosStyles+'"><div class="showEventsHolder"></div></div>';
        } else {
            // Both height and width provided.
            var showEventsFinal = '<div class="showEventsOverlay" position="'+showEventsPosition+'" style="display:block;height:'+ showEventsHeight +'px;width:'+ showEventsWidth +'px;'+customPosStyles+'"><div class="showEventsHolder"></div></div>';
        }
        $('#wrapper').append(showEventsFinal);
    }

    // Put the showEvents text into the showEvents container.
    var textFinal = '<div class="'+divClass+'-showEvents showEventsMessage" style="color: '+showEventsColor+'; background-color: '+showEventsBackgroundColor+'; font-size: '+showEventsFontSize+'; text-align: '+showEventsAlignment+'">'+showEventsText+'</div>';

    // Animate it!
    if(showEventsType === "replace"){
        showEventsElementReplace(data.enterAnimation, data.exitAnimation, showEventsDuration, textFinal);
    } else {
        showEventsElementList(data.enterAnimation, data.exitAnimation, showEventsDuration, textFinal, divClass+'-showEvents');
    }
}