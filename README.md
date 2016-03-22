# Visual Viewport API

## tl;dr

We propose adding a `visualViewport` object on `document` that contains the properties of the visual viewport.

## Background

The mobile web contains two viewports, the Layout and Visual viewport. The Layout viewport is what a page lays out its elements into(*) and the Visual viewport is what is actually visible on the screen. When the user pinch-zooms into the page, the visual viewport shrinks but the layout viewport is unchanged. UI like the on-screen keyboard (OSK) can also shrink the visual viewport without affecting the layout viewport. See this [demo](http://bokan.ca/viewport/index.html) to visualize the two viewports. This isn't specified anywhere and implementations vary greatly between browsers.

Currently, several CSSOM scroll properties are relative to the visual viewport (see [this](https://docs.google.com/document/d/1ZzzvA_AuMDa_nlwIc9PdpzfIXsgrOZDixFvEFwrfXJM/edit#) for list). Again, there is no spec governing this, but this is how browsers have it implemented today. With this implementation, the dimensions of the visual viewport can be easily determined (For example, window.innerHeight = visual viewport height). However, all other coordinates are generally relative to the layout viewport (e.g. getBoundingClientRects, elementFromPoint, event coordinates, etc.). Having these APIs be mixed is arbitrary and confusing.

This confusion has caused many desktop sites to break when pinch-zoomed or when showing the OSK (see [this bug ](http://crbug.com/489206) for examples). This is because mobile browsers added new semantics to existing properties, expecting they'd to be invisible to desktop browsers. This becomes a problem as the lines between mobile and desktop blur and features like on-screen keyboard and pinch-zoom make their way to desktops, or when accessing desktop pages from mobile devices.

(*) - This isn't strictly true. In Chrome, the layout viewport is actually the "viewport at minimum scale". While on most well behaving pages this is the box that the page lays out into (i.e. the initial containing block), extra-wide elements or an explicit minimum-scale can change this. More specifically, the layout viewport is what position: fixed elements attach to.

## Proposed Plan

We believe the best way forward is to change those remaining CSSOM scroll properties to be relative to the layout viewport. In fact, Chrome did this in M48 but, due to [developer feedback](http://crbug.com/571297), this change was reverted in M49. There was more reliance on this than anticipated.

In order to make this transition we propose adding a new explicit API for the visual viewport. With an explicit API, and after a sufficient transition period, we could once again change the CSSOM scroll properties to be relative to the layout viewport. This change would make sure existing desktop sites continue to function correctly as new UI features are added. At the same time, it would allow authors to use and customize those features where needed.

The new API is also easy to feature detect and polyfilling this behavior should be fairly straightforward.

## Proposed API

  * Add a `visualViewport` object on `document`. 

```
visualViewport = {
    double scrollTop;  // Relative to the layout viewport
    double scrollLeft; // and writable.

    double clientWidth;  // Read-only and excludes the scrollbars
    double clientHeight; // if present.

    double pageScale; // Read-only
}
```

  * Fire a `viewportchanged` event against `document` whenever any of these properties change.

## Example

Here's how an author might use this API to simulate `position: device-fixed`, which fixes elements to the visual viewport.

```html
<style>
    #bottombar {
        position: fixed;
        left: 0px;
        right: 0px;
        bottom: 0px;
        transform-origin: left bottom;
        transform: translate(0px, 0px) scale(1);
    }
</style>

<body>
    <div id="bottombar">This stays stuck to the visual viewport</div>
</body>

<script>
    var bottomBar = document.getElementById('bottombar');
    var viewport = document.visualViewport;
    document.addEventListener('viewportchanged', function()   
    {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetX = viewport.scrollLeft;
        var offsetY = document.documentElement.clientHeight
                    - viewport.clientHeight
                    + viewport.scrollTop;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        bottomBar.style.transform = 'translate(' + 
                                    offsetX + 'px,' +
                                    offsetY + 'px) ' +
                                    'scale(' + 1/viewport.pageScale + ')'
    });
</script>
```
