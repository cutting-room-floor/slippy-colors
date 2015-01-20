"use strict";

/*global module, require*/

var d3 = require("d3");

/*
 Based on http://www.quirksmode.org/js/events_properties.html#position

 Adapted to know about d3.event.
 */
module.exports = function() {
    var posX = 0,
	posY = 0,

	e = d3.event ? d3.event :
	    e ? e :
	    window.event;

    if (e.pageX || e.pageY) {
	posX = e.pageX;
	posY = e.pageY;
    } else if (e.clientX || e.clientY) {
	posX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	posY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return {
	x: posX,
	y: posY
    };
};
