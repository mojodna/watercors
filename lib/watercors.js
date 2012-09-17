"use strict";

var express = require("express");
var middleware = require("./middleware");

var app = express();

app.configure(function() {
  app.use(middleware.CORS);
});

app.use("/cdec", require("./cdec"));

module.exports = app;
