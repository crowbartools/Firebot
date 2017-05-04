const JsonDB = require('node-json-db');
const request = require('request');

var dbSettings = new JsonDB("./app-settings/settings", true, false);

// Options
var options = {
    client_id: dbSettings.getData('/client_Id'),
    scopes: dbSettings.getData('/scopes')
};

// Login Kickoff
function login(){
    // Make a request to get a shortcode.
    request.post({url:'https://beam.pro/api/v1/oauth/shortcode', form: {client_id: options.client_id, scope: options.scopes}}, function(err,httpResponse,body){
        if (err === null){
            // Success!
            var body = JSON.parse(body);
            var handle = body.handle;
            var code = body.code;

            // Display a popup with the six digit code and instructions.
            loginModal(code);

            // Start check loop every second until we either get a 403, 404, or 200 response.
            // Once response is received close the popup window.
            loginLoop(handle);

            // Log info into auth file for interactive connection and change login page info.

        } else {
            console.log(err);
        }
    })
}

// Login Modal
function loginModal(code){
    var modalTemplate = `<div class="modal fade" id="loginModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Login Code</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>Click the code below to be taken to an authorization page. On the auth page please paste in the code to give Firebot access to run on your account.</p>
                                        <div class="login-code">Code: <br> <a href="https://beam.pro/go">${code}</a></div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

    // Put it in the html and render it.
    $('body').append(modalTemplate);
    $('#loginModal').modal(options);

    // When this modal gets hidden, remove it from the html.
    $('#loginModal').on('hidden.bs.modal', function (e) {
        $('#loginModal').remove();
    })
}

// Login Loop
function loginLoop(handle){

    var refreshInterval = setInterval(function(){
        request.get('https://beam.pro/api/v1/oauth/shortcode/check/'+handle, function (error, response, body) {
            var status = response.statusCode;

            // User denied access or key expired.
            if(status === 403 || status === 404){

                // Close and remove modal.
                $('#loginModal').modal('hide');

                // Stop loop
                clearInterval(refreshInterval);
            }

            // User Approved Access
            if(status === 200){
                var body = JSON.parse(body);
                var code = body.code;

                // Take the code and send it off for the auth tokens info.
                request.post({url:'https://beam.pro/api/v1/oauth/token', form: {client_id: options.client_id, code: code, grant_type: "authorization_code"}}, function(err,response,body){
                    if (err === null){
                        console.log('Success! Trying to get token...');
                        var body = JSON.parse(body);
                        // Success!
                        var accessToken = body.access_token;
                        var expires = body.expires_in;
                        var refreshToken = body.refresh_token;
                        var tokenType = body.token_type;

                        // Awesome, we got the auth token. Now to save it out for later.
                        console.log(accessToken, expires, refreshToken, tokenType);               

                    } else {
                        console.log(err);
                    }
                })

                // Close and remove modal.
                $('#loginModal').modal('hide');

                // Stop loop
                clearInterval(refreshInterval);
            }
        })
    }, 2000);

}


login();