// This is hacky but necessary in order to get the innerWidth/Height without
// page scale applied reliably.
function updateUnscaledDimensions() {
  if (!window.visualViewportPolyfill.iframeDummy) {
      var iframe = document.createElement('iframe');
      iframe.style.position="absolute";
      iframe.style.width="100%";
      iframe.style.height="100%";
      iframe.style.left="0px";
      iframe.style.top="0px";
      iframe.style.border="0";
      iframe.style.visibility="hidden";
      iframe.srcdoc = "<!DOCTYPE html><html><body style='margin:0px; padding:0px'></body></html>";

      document.body.appendChild(iframe);
      window.visualViewportPolyfill.iframeDummy = iframe;
  }

  var iframe = window.visualViewportPolyfill.iframeDummy;

  var documentRect = document.documentElement.getBoundingClientRect();
  var iframeBody = iframe.contentDocument.body;
  iframeBody.style.width = documentRect.width + 'px';
  iframeBody.style.height = documentRect.height + 'px';

  // Hide overflow temporarily so that the iframe size isn't shrunk by
  // scrollbars.
  var prevDocumentOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  var iframeWindow = window.visualViewportPolyfill.iframeDummy.contentWindow;
  window.visualViewportPolyfill.unscaledInnerWidth = iframeWindow.innerWidth;
  window.visualViewportPolyfill.unscaledInnerHeight = iframeWindow.innerHeight;

  document.documentElement.style.overflow = prevDocumentOverflow;
}

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
        window.visualViewportPolyfill.scrollLeftSinceLastChange != window.visualViewport.scrollLeft ||
        window.visualViewportPolyfill.scrollTopSinceLastChange != window.visualViewport.scrollTop;

    var sizeChanged =
        window.visualViewportPolyfill.clientWidthSinceLastChange != window.visualViewport.clientWidth ||
        window.visualViewportPolyfill.clientHeightSinceLastChange != window.visualViewport.clientHeight ||
        window.visualViewportPolyfill.scaleSinceLastChange != window.visualViewport.scale;

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
    window.addEventListener('resize', updateUnscaledDimensions, {'passive': true});
}

var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
var isSafari = navigator.userAgent.indexOf("Safari") > -1;
var isIEEdge = navigator.userAgent.indexOf('Edge') > -1;

if ((isChrome)&&(isSafari))
    isSafari=false;

if (window.visualViewport) {
    console.log('Using real visual viewport API');
} else {
    console.log('Polyfilling Viewport API');
    var layoutDummy = document.createElement('div');
    layoutDummy.style.width = "100%";
    layoutDummy.style.height = "100%";
    if (isSafari) {
        layoutDummy.style.position = "fixed";
    } else {
        layoutDummy.style.position = "absolute";
    }
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
      "layoutDummy": layoutDummy,
      "iframeDummy": null,
      "unscaledInnerWidth": 0,
      "unscaledInnerHeight": 0
    }

    registerChangeHandlers();

    // TODO: Need to wait for <body> to be loaded but this is probably
    // later than needed.
    window.addEventListener('load', function() {
        updateUnscaledDimensions();
        document.body.appendChild(layoutDummy);

        var viewport = {
          get scrollLeft() {
            if (isSafari) {
              // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
              return window.scrollX - (layoutDummy.getBoundingClientRect().left * this.scale + window.scrollX * this.scale);
            } else {
              return window.scrollX + layoutDummy.getBoundingClientRect().left;
            }
          },
          get scrollTop() {
            if (isSafari) {
              // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
              return window.scrollY - (layoutDummy.getBoundingClientRect().top * this.scale + window.scrollY * this.scale);
            } else {
              return window.scrollY + layoutDummy.getBoundingClientRect().top;
            }
          },
          get clientWidth() {
            var clientWidth = document.documentElement.clientWidth;
            if (isIEEdge) {
                // If there's no scrollbar before pinch-zooming, Edge will add
                // a non-layout-affecting overlay scrollbar. This won't be
                // reflected in documentElement.clientWidth so we need to
                // manually subtract it out.
                if (document.documentElement.clientWidth == window.visualViewportPolyfill.unscaledInnerWidth
                    && this.scale > 1) {
                    var oldWidth = document.documentElement.clientWidth;
                    var prevHeight = layoutDummy.style.height;
                    // Lengthen the dummy to add a layout vertical scrollbar.
                    layoutDummy.style.height = "200%";
                    var scrollbarWidth = oldWidth - document.documentElement.clientWidth;
                    layoutDummy.style.width = prevHeight;
                    clientWidth -= scrollbarWidth;
                }
            }
            return clientWidth / this.scale;
          },
          get clientHeight() {
            var clientHeight = document.documentElement.clientHeight;
            if (isIEEdge) {
                // If there's no scrollbar before pinch-zooming, Edge will add
                // a non-layout-affecting overlay scrollbar. This won't be
                // reflected in documentElement.clientHeight so we need to
                // manually subtract it out.
                if (document.documentElement.clientHeight == window.visualViewportPolyfill.unscaledInnerHeight
                    && this.scale > 1) {
                    var oldHeight = document.documentElement.clientHeight;
                    var prevWidth = layoutDummy.style.width;
                    // Widen the dummy to add a layout horizontal scrollbar.
                    layoutDummy.style.width = "200%";
                    var scrollbarHeight = oldHeight - document.documentElement.clientHeight;
                    layoutDummy.style.width = prevWidth;
                    clientHeight -= scrollbarHeight;
                }
            }
            return clientHeight / this.scale;
          },
          get scale() {
            return window.visualViewportPolyfill.unscaledInnerWidth / window.innerWidth;
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
