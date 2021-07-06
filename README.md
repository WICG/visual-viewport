# Visual Viewport API

## tl;dr

We propose adding a `visualViewport` object on `window` that contains the
properties of the visual viewport.  We're incubating this idea via the WICG in
order to try to make incremental progress on the long-standing problem of
exposing features like pinch-zoom to web developers in a rational way.  We are
working with the CSSWG to eventually get [these
ideas](https://github.com/w3c/csswg-drafts/issues/206) into [the relevant
specs](https://github.com/w3c/csswg-drafts/issues/505) as first-class features
of the web platform.

_Update: The `window.visualViewport` API has shipped in Chrome M61 (Sept. 2017). Follow crbug
[issue 635031](http://crbug.com/635031) for details._

## Draft Spec

[Draft Spec](https://wicg.github.io/visual-viewport/index.html)

## Background

The mobile web contains two viewports, the Layout and Visual viewport. The
Layout viewport is what a page lays out its elements into(*) and the Visual
viewport is what is actually visible on the screen. When the user pinch-zooms
into the page, the visual viewport shrinks but the layout viewport is
unchanged. UI like the on-screen keyboard (OSK) can also shrink the visual
viewport without affecting the layout viewport. See this
[demo](http://bokand.github.io/viewport/index.html) to visualize the two
viewports. This isn't specified anywhere and implementations vary greatly
between browsers.

Currently, several CSSOM scroll properties are relative to the visual viewport
(see
[this](https://docs.google.com/document/d/1ZzzvA_AuMDa_nlwIc9PdpzfIXsgrOZDixFvEFwrfXJM/edit#)
for list). Again, there is no spec governing this, but this is how browsers
  have it implemented today. With this implementation, the dimensions of the
  visual viewport can be easily determined (For example, window.innerHeight =
  visual viewport height). However, all other coordinates are generally
  relative to the layout viewport (e.g. getBoundingClientRects,
  elementFromPoint, event coordinates, etc.). Having these APIs be mixed is
  arbitrary and confusing.

This confusion has caused many desktop sites to break when pinch-zoomed or when
showing the OSK (see [this bug ](http://crbug.com/489206) for examples). This
is because mobile browsers added new semantics to existing properties,
expecting they'd to be invisible to desktop browsers. This becomes a problem as
the lines between mobile and desktop blur and features like on-screen keyboard
and pinch-zoom make their way to desktops, or when accessing desktop pages from
mobile devices.

(*) - This isn't strictly true. In Chrome, the layout viewport is actually the
"viewport at minimum scale". While on most well behaving pages this is the box
that the page lays out into (i.e. the initial containing block), extra-wide
elements or an explicit minimum-scale can change this. More specifically, the
layout viewport is what position: fixed elements attach to.

## Proposed Plan

We believe the best way forward is to change those remaining CSSOM scroll
properties to be relative to the layout viewport. In fact, Chrome did this in
M48 but, due to [developer feedback](http://crbug.com/571297), this change was
reverted in M49. There was more reliance on this than anticipated.

In order to make this transition we propose adding a new explicit API for the
visual viewport. With an explicit API, we could once again change the CSSOM 
scroll properties to be relative to the layout viewport. This change would make
sure existing desktop sites continue to function correctly as new UI features
are added. At the same time, it would allow authors to use and customize those
features where needed.

The new API is also easy to feature detect and polyfilling this behavior should
be fairly straightforward.

## Proposed API (v1)

  * Add a `visualViewport` object on `window`.

```
visualViewport = {
    double offsetLeft; // Relative to the layout viewport
    double offsetTop; // and read-only.

    double pageLeft;  // Relative to the document
    double pageTop;  // and read-only.

    double width;  // Read-only and excludes the scrollbars
    double height; // if present. These values give the number
                   // of CSS pixels visible in the visual viewport.
                   // i.e. they shrink as the user zooms in.

    double scale;     // Read-only. The scaling factor applied to
                      // the visual viewport relative to the `ideal
                      // viewport` (size at width=device-width). This
                      // is the same scale as used in the viewport
                      // <meta> tag.
    
    FrozenArray<DOMRect> segments; // Read-only. Returns an array of 
                                   // DOMRects that represent the dimensions 
                                   // of each existing viewport segment.

}
```

  * Fire a `scroll` event against `window.visualViewport` whenever the `offsetLeft` or `offsetTop` attributes change.

  * Fire a `resize` event against `window.visualViewport` whenever the `width` or `height` attributes change.
  
  * The viewport segments property is currently in development and experimental. Please view the [segments explainer](https://github.com/WICG/visual-viewport/tree/gh-pages/segments-explainer) for more details. 

## Example

Here's how an author might use this API to simulate `position: device-fixed`, which fixes elements to the visual viewport.

[Live example from below](https://wicg.github.io/visual-viewport/examples/fixed-to-viewport.html)

```html
<meta name="viewport" content="width=device-width">
<style>
    #layoutViewport {
        position: fixed;
        width: 100%;
        height: 100%;
        visibility: hidden;
    }
    #bottombar {
        position: fixed;
        left: 0px;
        right: 0px;
        bottom: 0px;
        background-color: red;
        transform-origin: left bottom;
        transform: translate(0px, 0px) scale(1);
    }
    #forcescrolling {
        width: 100px;
        height: 2000px;
        background-color: green;
    }
</style>

<body>
    <div id="bottombar">This stays stuck to the visual viewport</div>
    <div id="forcescrolling"></div>
    <div id="layoutViewport"></div>
</body>

<script>
    var bottomBar = document.getElementById('bottombar');
    var viewport = window.visualViewport;
    function viewportHandler() {
        var layoutViewport = document.getElementById('layoutViewport');

        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetLeft = viewport.offsetLeft;
        var offsetTop = viewport.height
                    - layoutViewport.getBoundingClientRect().height
                    + viewport.offsetTop;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        bottomBar.style.transform = 'translate(' +
                                    offsetLeft + 'px,' +
                                    offsetTop + 'px) ' +
                                    'scale(' + 1/viewport.scale + ')'
    }
    window.visualViewport.addEventListener('scroll', viewportHandler);
    window.visualViewport.addEventListener('resize', viewportHandler);
</script>
```
## Other Examples

Here's a few other examples you can try out on Chrome Canary today. Be sure to turn on the following flags:

  * chrome://flags/#enable-experimental-web-platform-features (Enable window.visualViewport)
  * chrome://flags/#inert-visual-viewport (Makes window.scrollX|innerWidth and others refer to layout viewport)
  * chrome://flags/#enable-osk-overscroll (Makes keyboard resize visual viewport only)

### Links

  * [Hide on Zoom](https://wicg.github.io/visual-viewport/examples/hide-on-zoom.html): Overlays a position: fixed
    box in the viewport (e.g. an ad) but hides to improve the UX when the user zooms in.
  * [Fixed to keyboard](https://wicg.github.io/visual-viewport/examples/fixed-to-keyboard.html): Keeps a bar (e.g.
    text formatting toolbar) fixed to the keyboard when it comes up.
  * [Fixed to keyboard (No Zoom)](https://wicg.github.io/visual-viewport/examples/fixed-to-keyboard-no-zoom.html):
    Same as above but makes the bar behave like position: fixed rather than position: device-fixed. That is, the
    bar will stay above the keyboard, but if the user zooms in it will remain in its original position.
  * [Fixed to viewport](https://wicg.github.io/visual-viewport/examples/fixed-to-viewport.html): Simulates position:
    device-fixed by keeping a bar fixed to the visual viewport.
  * [Fixed to viewport (absolute)](https://wicg.github.io/visual-viewport/examples/absolute-fixed-to-viewport.html):
    Uses position: absolute to accomplish a position: sticky type effect that works with pinch-zoom.

### Polyfill

  TODO: Doesn't work on iOS Safari yet.
  We've added a rudimentary polyfill that should work across browsers, albeit with worse
  performance properties (requires polling and ugly hacks). The polyfill itself is
  [visualViewport.js](https://github.com/WICG/visual-viewport/blob/gh-pages/polyfill/visualViewport.js)
  and you can see two examples that use it in the same directory:

  * [position: device-fixed with position: fixed](https://wicg.github.io/visual-viewport/polyfill/vvapi-fix.html)
  * [position: device-fixed with position: absolute](https://wicg.github.io/visual-viewport/polyfill/vvapi-abs.html)
