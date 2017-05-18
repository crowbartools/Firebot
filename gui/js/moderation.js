//Event List Kickoff
// This should be run on app load and initializes the event logger list.
function eventLoggerKickoff(){
    // Set default variable for listjs
    var events = [];
    
    // Set options for the list.
    var options = {
        valueNames: ['milliseconds','timestamp', 'username', 'event'],
        page: 10,
        pagination: true,
        item: '<li class="event-item"><span class="milliseconds"></span><span class="timestamp"></span><span class="username"></span><span class="event"></span></li>'
    };

    // Initalize List
    eventUserList = new List('event-log', options, events);

    // Run log cleaner every 60 seconds.
    setInterval(function(){
        logCleaner();
    }, 60000);
}

// Event Logger
// This takes some data and logs it in the event logger.
function eventLogger(data){
    var username = data.username;
    var eventText = data.event;
    var time = timeStamp();

    // Tag this item with milliseconds so we can easily purge them later.
    var d = new Date();
    var milliseconds = d.getTime();

    eventUserList.add({milliseconds: milliseconds, timestamp: time, username: username, event: eventText});
    eventUserList.sort('milliseconds', {order: "desc"});
}

// Log Cleaner
// Removes all items from the log past X amount of time.
function logCleaner(){
    var d = new Date();
    var milliseconds = d.getTime();
    var purgeTime = 120000;

    // Loop through all of the events that are logged and remove any that are past due.
    $('#event-log li').each(function(index){
        var purgeCounter = parseInt( $(this).find('.milliseconds').text() ) + purgeTime;
        if (purgeCounter < milliseconds){
            $(this).fadeOut('fast',function(){
                $(this).remove();
            })
        }
    })

    // Reindex list.
    eventUserList.reIndex();
}

// Pretty timestamp
function timeStamp() {
    var now = new Date();
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
        time[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return time.join(":") + " " + suffix;
}

// Watches for an error event from main process
ipcRenderer.on('eventlog', function (event, data){
    eventLogger(data);
})


// ON APP START
eventLoggerKickoff();