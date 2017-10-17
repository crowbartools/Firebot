// store token > filepath relationships
const tokens = {}

function rand() {
    return Math.random().toString(36).substr(2);
};

function newToken() {
    // Generate a token by combining two randomly generated numbers that are converted to base 36
    return rand() + rand();
};

function getResourcePath(token) {
  var resource = tokens[token];
  if(resource != null) {
    // delete the token if we actually had something saved.
    // 1 second delay before deletion to  allow multiple requests at once.
    deleteToken(token);
  }
  return resource;
}

function storeResourcePath(path) {
  var token = newToken();
  tokens[token] = path;
  return token;
}

function deleteToken(token) {
  setTimeout((t)=> {
    if(tokens[t] != null) {
      delete tokens[t];
    }
  }, 1000, token);
}

exports.getResourcePath = getResourcePath;
exports.storeResourcePath = storeResourcePath;




 