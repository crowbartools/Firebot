// Show HTML
// This will take the data that is sent to it from the GUI and render on the overlay.
function showHtml(data){
    var element, _element;
    element = _element = $('#wrapper').append(data.html);

    setTimeout(function(){
        // If CSS class is provided, remove element(s) with provided CSS class.
        if(data.removal){
            element = element.parent().find("." + data.removal);
            
            //If no elements found, remove original element.
            if(!element.length) element = _element;
        }

        element.animateCss(data.exitAnimation || "fadeOut", function(){ // Default Animation: Fade Out
            element.remove();
        });
    }, parseFloat(data.length || 10) * 1000); // Default Show Time: 10 Seconds
}
