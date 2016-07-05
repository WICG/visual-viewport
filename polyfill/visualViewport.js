function fireScrollEvent() {
  var listeners = window.visualViewportPolyfill.scrollEventListeners;
  for (var i = 0; i < listeners.length; i++)
    listeners[i]();
}

function fireResizeEvent() {
  var listeners = window.visualViewportPolyfill.resizeEventListeners;
  for (var i = 0; i < listeners.length; i++)
    listeners[i]();
}

function updateViewportChanged() {
    var scrollChanged =
        window.visualViewportPolyfill.scrollLeftSinceLastChange == window.visualViewport.scrollLeft ||
        window.visualViewportPolyfill.scrollTopSinceLastChange == window.visualViewport.scrollTop;

    var sizeChanged =
        window.visualViewportPolyfill.clientWidthSinceLastChange == window.visualViewport.clientWidth ||
        window.visualViewportPolyfill.clientHeightSinceLastChange == window.visualViewport.clientHeight ||
        window.visualViewportPolyfill.scaleSinceLastChange == window.visualViewport.scale;

    window.visualViewportPolyfill.scrollLeftSinceLastChange = window.visualViewport.scrollLeft;
    window.visualViewportPolyfill.scrollTopSinceLastChange = window.visualViewport.scrollTop;
    window.visualViewportPolyfill.clientWidthSinceLastChange = window.visualViewport.clientWidth;
    window.visualViewportPolyfill.clientHeightSinceLastChange = window.visualViewport.clientHeight;
    window.visualViewportPolyfill.scaleSinceLastChange = window.visualViewport.scale;

    if (scrollChanged)
      fireScrollEvent();

    if (sizeChanged)
      fireResizeEvent();

    setTimeout(updateViewportChanged, 500);
}

function registerChangeHandlers() {
    window.addEventListener('scroll', updateViewportChanged, {'passive': true});
    window.addEventListener('resize', updateViewportChanged, {'passive': true});
}

if (window.visualViewport) {
    console.log('Using real visual viewport API');
} else {
    console.log('Polyfilling Viewport API');
    var layoutDummy = document.createElement('div');
    layoutDummy.style.width = "100%";
    layoutDummy.style.height = "100%";
    layoutDummy.style.position = "absolute";
    layoutDummy.style.left = "0px";
    layoutDummy.style.top = "0px";
    layoutDummy.style.visibility = "hidden";

    window.visualViewportPolyfill = {
      "scrollLeftSinceLastChange": null,
      "scrollTopSinceLastChange": null,
      "clientWidthSinceLastChange": null,
      "clientHeightSinceLastChange": null,
      "scaleSinceLastChange": null,
      "scrollEventListeners": [],
      "resizeEventListeners": [],
      "layoutDummy": layoutDummy
    }

    registerChangeHandlers();

    // TODO: Need to wait for <body> to be loaded but this is probably
    // later than needed.
    window.addEventListener('load', function() {
        document.body.appendChild(layoutDummy);

        var viewport = {
          get scrollLeft() {
            return window.scrollX + layoutDummy.getBoundingClientRect().left;
          },
          get scrollTop() {
            return window.scrollY + layoutDummy.getBoundingClientRect().top;
          },
          get clientWidth() {
            return window.innerWidth - 15;
          },
          get clientHeight() {
            return window.innerHeight - 15;
          },
          get scale() {
            return window.outerWidth / window.innerWidth;
          },
          get pageX() {
            return window.scrollX;
          },
          get pageY() {
            return window.scrollY;
          },
          "addEventListener": function(name, func) {
            // TODO: Match event listener semantics. i.e. can't add the same callback twice.
            if (name === 'scroll')
              window.visualViewportPolyfill.scrollEventListeners.push(func);
            else if (name === 'resize')
              window.visualViewportPolyfill.resizeEventListeners.push(func);
          }
        };

        window.visualViewport = viewport;
    });
}
