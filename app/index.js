/*
* Primary file for the API
*/

// Dependencies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");

// Instantiating HTTP server
var httpServer = http.createServer(function (req,res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function() {
  console.log("the server is listening on port " + config.httpPort);
});

// HTTPS server options
var httpServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

// Instantiating HTTPS server
var httpsServer = http.createServer(httpServerOptions, function (req,res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpServer.listen(config.httpsPort, function() {
  console.log("the server is listening on port " + config.httpsPort);
});

// All the server logic for both HTTP and HTTPS server
var unifiedServer = function(req, res) {
  // get the URL and parse interval
  var parsedUrl = url.parse(req.url, true);

  // get the request path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get query strings
  var queryStringsObject = parsedUrl.query;

  // get the HTTP request method
  var method = req.method.toLowerCase();

  // get the HTTP headers
  var headers = req.headers;

  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function(data) {
    buffer += decoder.write(data);
  });

  req.on('end', function() {
    buffer += decoder.end();

    // Choose the handler for this request should go to. If one is not found then use the notFound handler
    var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      'trimmedPath' : trimmedPath,
      'queryStringsObject' : queryStringsObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Route the request to the handler specified in the router
    choosenHandler(data, function(statusCode, payload) {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);


      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // log the request path
      console.log("Returning this response ", statusCode, payloadString);
    });
  });
};

// Define the handlers
var handlers = {};

// Ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Hello handler
handlers.hello = function(data, callback) {
  callback(200, {'message' : 'Hello World!!!'});
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Define a request router
var router = {
  'ping' : handlers.ping,
  'hello' : handlers.hello
};
