"use strict";

var crypto = require("crypto"),
    fs = require("fs"),
    url = require("url"),
    zlib = require("zlib");

var APIClient = {};

/**
 * Process HTTP responses. Handle compressed streams and convert to objects as
 * appropriate.
 *
 * @param {Function} callback Function to pass processed data to.
 */
APIClient.processResponse = function(callback) {
  return function(response) {
    // response is a stream, but we may pipe the stream and still need
    // access to response properties
    var stream = response;

    switch (response.headers['content-encoding']) {
    case 'gzip':
      stream = response.pipe(zlib.createGunzip());
      break;

    case 'deflate':
      stream = response.pipe(zlib.createInflate());
      break;
    }
    
    var data = '';
    stream.on('data', function(chunk) {
      data += chunk;
    });

    stream.on('end', function() {
      callback(undefined, data, response);
    });
  };
};

APIClient.request = function(method, options, requestBody, useCache, callback) {
  options.method = method;
  options.headers["Accept"] = "application/json";
  options.headers["Accept-Encoding"] = "deflate,gzip";

  var protocol;

  switch(options.protocol) {
  case "http:":
    protocol = require("http");
    break;

  case "https:":
    protocol = require("https");
    break;

  default:
    throw new Error("Protocol:" + options.protocol + " not supported.");
  }

  if (requestBody) {
    if (requestBody instanceof Object) {
      options.headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(requestBody);
    } else {
      options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    options.headers["Content-Length"] = requestBody.length;
  }

  // cache function
  var cache = function() {};
  var makeRequest = function() {
    var req = protocol.request(options).on("response", APIClient.processResponse(function(err, body, response) {
      cache(response.headers, body);

      callback(err, body, response);
    }));

    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  };

  if (method === "GET" && useCache) {
    // configure caching
    var hash = crypto.createHash("sha1").update(options.href).digest("hex");
    // TODO globally configure cache directory
    var cacheDir = process.cwd() + "/cache/";
    var cacheFile = cacheDir + hash + ".json";

    cache = function(headers, body) {
      fs.mkdir(cacheDir, function() {
        fs.writeFile(cacheDir + hash + ".meta.json", JSON.stringify({
          "cache-control": headers['cache-control'],
          etag: headers['etag'],
          cached: new Date().toISOString()
        }));

        fs.writeFile(cacheFile, JSON.stringify(body));
      });
    };

    var _makeRequest = makeRequest;
    makeRequest = function() {
      fs.stat(cacheFile, function(err, stats) {
        if (stats && stats.isFile()) {
          // cache exists; use it
          // TODO check metadata for expiration
          callback(null, require(cacheFile));
        } else {
          // cache unavailable; proceed normally
          _makeRequest();
        }
      });
    };
  }

  makeRequest();
};

APIClient.GET = function(u, headers, cache, callback) {
  switch (arguments.length) {
  case 2:
    headers = undefined;
    cache = undefined;
    callback = arguments[1];
    break;

  case 3:
    headers = undefined;
    cache = undefined;
    callback = arguments[2];

    if (arguments[1] instanceof Object) {
      headers = arguments[1];
    } else {
      cache = arguments[1];
    }
  }

  callback = arguments[arguments.length - 1];

  if (arguments.length == 2) {
    callback = headers;
    headers = undefined;
  }

  var options = url.parse(u);
  options.headers = headers || {};

  cache = cache || false;

  this.request("GET", options, null, cache, callback);
};

APIClient.POST = function(u, headers, body, callback) {
  if (arguments.length == 2) {
    callback = headers;
    headers = undefined;
  }

  var options = url.parse(u);
  options.headers = headers || {};

  this.request("POST", options, body, callback);
};

module.exports = APIClient;
