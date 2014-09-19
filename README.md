A D3 color picker component. It's a color picker...*and* a slippy map.

## usage

``` js
d3.select('body')
    .append('div')
    .call(ColorPicker()
         .width(700)
         .height(500)
         .on('mouseup', function(c) { console.log(c) }));
             // or whatever you want to do with the hex color returned on click
```
