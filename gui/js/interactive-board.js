
// Add New Interactive Button
// Adds a new button to the interactive board.
function addNewButton(){

    var buttonID = 1;
    var buttonHtml = `<div class="iButton">
                        <div class="button-title">
                            <div class="button-log button-icon">
                            <a href="#">
                                <i class="fa fa-list" aria-hidden="true"></i>
                            </a>
                            </div>
                            <div class="button-edit button-icon">
                            <a href="#">
                                <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                            </a>
                            </div>
                            <div class="button-id button-icon">
                            <span>ID:${buttonID}</span>
                            </div>
                            <div class="button-del button-icon">
                            <a href="#">
                                <i class="fa fa-minus-circle" aria-hidden="true"></i>
                            </a>
                            </div>
                        </div>
                        <div class="button-content">
                            Not Set
                        </div>`; 


}

// Add New Button Watcher
$('.button-menu-toggle').sidr({
    name: 'button-menu',
    source: '#button-menu',
    side: 'right',
    renaming: false
});
