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
            canvas.restore();
            pos = t, zm = s;
        }

        function getPos() {
            var rect = canvasBox[0][0].getBoundingClientRect();
            var mp = {
                x: ((d3.event.x - rect.left)  * (w / canvW) - pos[0]) / zm,
                y: ((d3.event.y - rect.top)  * (h / canvH) - pos[1]) / zm
            };
            while (mp.x < 0) mp.x += w;
            while (mp.x > 628) mp.x -= w;
            return mp;
        }

        function getColor(pos) {
            var rgba = colors.getImageData(pos.x, pos.y, 1, 1).data;
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
            // TODO isn't updating tl, something about the edge of the box (works for say blue but not red)
            // TODO also breaks for when scrolled past the first canvas
              var loc = loc || getPos();
                        // TODO loc isn't used yet, but will break bc not normalized by getPos -- refactor all to use obj or arr
              var scale = scale || zm;
              var view = {x: w / scale, y: h / scale};
              var tl = {x: view.x / 2 - loc.x, y: view.y / 2 - loc.y };

            d3.transition().duration(600).tween('zoom', function() {
                var ix = d3.interpolate(pos[0], tl.x),
                    iy = d3.interpolate(pos[1], tl.y),
                    is = d3.interpolate(zm, scale);
                return function(t) {
                    zoom([ix(t), iy(t)], is(t));
                }
            });

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
            // TODO sometimes pan -> click doesn't trigger, have to click again
            clicking = false, dragging = false;
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

    function hexToRgb (hexa) {
                // TODO if needed
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
