"use strict";

/*global require*/

var d3 = require("d3"),
    colors = require("./colorpicker.js");

var body = d3.select(document.body),
    picker = body.append("div")
	.call(colors()
	      .width(100)
	      .height(100)
	      .on("mouseup", function(color) {
		  chosenColor.style("background-color", color);
	      })
	     ),
    chosenColor = body.append("div")
	.html("&nbsp;")
	.style("display", "block")
	.style("width", "100px");

