"use strict";

/**
 * Emit cross-origin request headers (http://www.w3.org/TR/cors/).
 */
module.exports.CORS = function(req, res, next) {
    if (req.headers.origin) {
        if (req.method === "OPTIONS" && req.headers["access-control-request-method"]) {
            console.log("Preflighting use of %s from %s", req.headers["access-control-request-method"], req.headers.origin);

            // TODO implement to allow non-simple methods (i.e., not GET, HEAD, POST)
            // Access-Control-Request-Headers is also potentially relevant here
            res.send(200);
            return;
        }

        // n.b.: if HTTP caching is enabled, whatever origin had its request
        // cached will remain in the cache. Either include a repeatable cache
        // buster (?origin=<hostname>) or keep as '*' (if credentials (auth,
        // cookies; OAuth should be fine) are not necessary)
        res.header("Access-Control-Allow-Origin", "*");

        // credentials only work if Access-Control-Allow-Origin matches the
        // Origin header (not '*')
        // res.header("Access-Control-Allow-Credentials", "true");

        res.header("Access-Control-Max-Age", 60 * 60); // 1 hour
    }

    next();
};

// TODO generate a function using provided defaults
module.exports.OpenSearch = function(req, res, next) {
    req.opensearch = {};

    if (req.param("dtstart")) {
        req.opensearch.dtstart = new Date(req.param("dtstart"));
    }

    if (req.param("dtend")) {
        req.opensearch.dtend = new Date(req.param("dtend"));
    }

    if (req.param("count")) {
        req.opensearch.count = Number(req.param("count"));
    } else {
        req.opensearch.count = 1;
    }

    if (req.param("startIndex")) {
        req.opensearch.startIndex = Number(req.param("startIndex"));
    } else {
        req.opensearch.startIndex = 1;
    }

    next();
};
