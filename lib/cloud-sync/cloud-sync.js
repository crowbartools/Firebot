const logger = require("../logwrapper");
const request = require("request");

function sync(jsonData){
    return new Promise(resolve => {
        request.post({
            url:'https://bytebin.lucko.me/post', 
            headers: {
                'User-Agent': 'Firebot - https://crowbartools.com',
                'Content-Type': 'json',
                'Content-Encoding': 'gzip'
            },
            form: JSON.stringify(jsonData)
        }, function(err,httpResponse,body){
            if(err){
                logger.error('Bytebin sync failed.');
                logger.error(err);
                resolve(false);
            } else {
                body = JSON.parse(body);
                logger.debug('Bytebin key: ' + body.key);
                resolve(body.key);
            }
        });
    });
}

exports.sync = sync;