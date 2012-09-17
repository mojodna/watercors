"use strict";

var express = require("express");
var app = express();

app.configure(function() {
  app.use(express.compress());
});

app.use(require("./index"));

app.listen(process.env.PORT || 5001, function() {
  console.log("Listening on http://%s:%d/", this.address().address, this.address().port);
});
