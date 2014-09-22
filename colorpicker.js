var interpolate = require('fischer-color').interpolate;
var d3 = require('d3');

function ColorPicker() {
    var w = 628,
    	h = 100,
    	canvW = 600,
    	canvH = 400;

    var events = d3.dispatch('mousedown', 'mouseover', 'mouseup');

    var ext = {min: 0, max: w, xs: [0]}
    var pos = [0,0],
    	zm = 1;

    var canv = document.createElement('canvas');
    canv.width = w;
    canv.height = h;
    var colors = canv.getContext('2d');
    var image = colors.getImageData(0, 0, w, h);
    var imageMap = {};
    for (var i = 0, j = -1, c; i < w * h; ++i) {
        c = interpolate((i % w)/h, 1, Math.floor(i/w)/h);
        image.data[++j] = c[0];
        image.data[++j] = c[1];
        image.data[++j] = c[2];
        image.data[++j] = 255;
        var thisC = [];
        c.forEach(function(i){ thisC.push(Math.round(i)) });
        if (!imageMap[thisC]) imageMap[thisC] = [j];
        else imageMap[thisC].push(j);
    }

    colors.putImageData(image, 0, 0);

    function findColor(rgb) {
        var l = imageMap[rgb];
        var loc = l.reduce(function(a,b){return a+b}) / l.length;
        var x, y;
        var pxW = w*4;
        y = Math.ceil(loc/pxW);
        x = Math.floor((loc % pxW) / 4);
        return [x,y];
        // TODO this is just a bit off (rounding errors or something)
        // TODO this breaks for non-represented RGBs -- figure out a way to do reverse fischer-color lookups.
    }

    function cp(selection) {

        var canvasBox = selection.append('canvas')
        	.attr('width', w)
        	.attr('height', h)
        	.attr('style', 'width:' + canvW + 'px;height:' + canvH + 'px;');

        var dzoom = d3.behavior.zoom()
        	.scaleExtent([1, 8])
        	.on('zoom', zoom)

        var canvas = canvasBox
        	.call(dzoom)
        	.node().getContext("2d");

        cp.draw(canvas);

        function zoom(tr, sc) {
            canvas.save();
            canvas.clearRect(0, 0, w, h);
            var t = tr || d3.event.translate;
            if (-t[0] + w > ext.max) {
                ext.xs.push(ext.max);
                ext.max += w;
            } else if (-t[0] < ext.min) {
                ext.xs.push(ext.min - w);
                ext.min -= 628;
            }
            var s = sc || d3.event.scale;
            t[1] = Math.min(Math.max(t[1], -h*(s-1)), 0);
            canvas.translate(t[0],t[1]);
            // TODO ugh i can't get dzoom to persist programmatic zoom, so click -> move will reset to last move z
            canvas.scale(s,s);
            cp.draw(canvas);
            pos = t; zm = s;
            canvas.restore();
        }

        function getPos() {
            var rect = canvasBox[0][0].getBoundingClientRect();
            var mp = [
            	((d3.event.x - rect.left)  * (w / canvW) - pos[0]) / zm,
            	((d3.event.y - rect.top)  * (h / canvH) - pos[1]) / zm
            ];
            return mp;
        }

        function getColor(p) {
            while (p[0] < 0) p[0] += w;
            while (p[0] > 628) p[0] -= w;
            var rgba = colors.getImageData(p[0], p[1], 1, 1).data;
            if (rgba.length > 4) {
                var r = [], g = [], b = [], a = [];
                for (var i=0; i<rgba.length; i+=4) {
                    r.push(rgba[i]);
                    g.push(rgba[i+1]);
                    b.push(rgba[i+2]);
                    a.push(rgba[i+3]);
                }
                rgba = [];
                [r,g,b,a].forEach(function(c){
                    rgba.push(Math.round(c.reduce(function(a,b){
                        return a+b;
                    }) / c.length));
                });
            }
            return rgbToHex(rgba);
        }


        function goTo(loc, scale) {
            var loc = loc || getPos();
            var scale = scale || zm;
            var tl = [ w/2 - loc[0]*scale, h/2 - loc[1]*scale ];

            d3.transition().duration(600).tween('zoom', function() {
                var ix = d3.interpolate(pos[0], tl[0]),
                	iy = d3.interpolate(pos[1], tl[1]),
                	is = d3.interpolate(zm, scale);
                return function(t) {
                    zoom([ix(t), iy(t)], is(t));
                }
            });

          	dzoom.translate(tl);
        }



        var clicking = false, dragging = false;
        selection.on('mousedown', function() {
            clicking = true;
        });
        selection.on('mousemove', function() {
            if (clicking) dragging = true;
        });
        selection.on('mouseup', function(d) {
            if (!dragging) {
                events.mouseup(getColor(getPos()), goTo());
            }
            // TODO not on doubleclick
            clicking = false; dragging = false;
        });


    }

    cp.draw = function(c) {
        ext.xs.forEach(function(atX) {
            c.drawImage(canv, atX, 0);
        })
    }

    cp.width = function(_) {
        if (!arguments.length) return canvW;
        canvW = _;
        return cp;
    }

    cp.height = function(_) {
        if (!arguments.length) return canvH;
        canvH = _;
        return cp;
    }

    function hextoRGB(hex){
        var shr = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shr, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return res ? {
            r: parseInt(res[1], 16),
            g: parseInt(res[2], 16),
            b: parseInt(res[3], 16)
        } : null;
    }

    function rgbToHex (rgb) {
        var hexa = '#';
        [rgb[0],rgb[1],rgb[2]].forEach(function(c) {
            var h = c.toString(16);
            hexa += h.length == 1 ? '0' + h : h;
        });
        return hexa;
    }

    return d3.rebind(cp, events, 'on', 'off');

}

module.exports = ColorPicker;
