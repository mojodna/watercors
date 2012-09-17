"use strict";

var util = require("util");
var d3 = require("d3"),
    express = require("express");
var APIClient = require("./api_client"),
    middleware = require("./middleware");

var formatDate = d3.time.format("%Y/%m/%d");

var app = express();

app.configure(function() {
  app.use(middleware.OpenSearch);
});

app.get("/:station_id/:sensor_num/:dur_code", function(req, res) {
  var endDate = req.opensearch.dtend || new Date();
  var startDate = req.opensearch.dtstart || new Date(endDate - req.opensearch.count * 86400 * 1000);
  var url = util.format(
    "http://cdec.water.ca.gov/cgi-progs/queryCSV?station_id=%s&dur_code=%s&sensor_num=%s&start_date=%s&end_date=%s",
    req.params["station_id"],
    req.params["dur_code"].toUpperCase(),
    parseInt(req.params["sensor_num"]),
    formatDate(startDate),
    formatDate(endDate)
  );

  var useCache = (new Date() - endDate) > 86400 * 1000;

  APIClient.GET(url, useCache, function(err, data, rsp) {
    // TODO stream data back

    data = ["date,time,flow"].concat(data.split("\n").filter(function(line, i) {
      return i > 2;
    })).join("\n");
    
    if (useCache) {
      // TODO increase this (this can be effectively infinite once any kinks
      // are worked out)
      res.header("Cache-Control", "max-age=3600");
    }

    res.contentType("text/csv");
    res.send(data);
  });
});

module.exports = app;
