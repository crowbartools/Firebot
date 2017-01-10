// Initialize the Button Menu
// This starts up sidr to create the side button menu.
$('.hidden').sidr({
    name: 'button-menu',
    source: '#button-menu',
    side: 'right',
    renaming: false,
    onOpen: function(){
        // Stuff happens here when menu opens.
    }
});

// Add New Button
// These functions work together to open the button menu with full options for adding a new button.
$( ".add-new-button" ).click(function() {
  addNewButton();
});
function addNewButton(){
    $.sidr('open', 'button-menu');
}