// This is hacky but necessary in order to get the innerWidth/Height without
// page scale applied reliably.
function updateUnscaledDimensions() {
  if (!window.viewPolyfill.iframeDummy) {
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
      window.viewPolyfill.iframeDummy = iframe;
  }

  var iframe = window.viewPolyfill.iframeDummy;

  var documentRect = document.documentElement.getBoundingClientRect();
  var iframeBody = iframe.contentDocument.body;
  iframeBody.style.width = documentRect.width + 'px';
  iframeBody.style.height = documentRect.height + 'px';

  // Hide overflow temporarily so that the iframe size isn't shrunk by
  // scrollbars.
  var prevDocumentOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  var iframeWindow = window.viewPolyfill.iframeDummy.contentWindow;
  window.viewPolyfill.unscaledInnerWidth = iframeWindow.innerWidth;
  window.viewPolyfill.unscaledInnerHeight = iframeWindow.innerHeight;

  document.documentElement.style.overflow = prevDocumentOverflow;
}

function fireScrollEvent() {
  var listeners = window.viewPolyfill.scrollEventListeners;
  for (var i = 0; i < listeners.length; i++)
    listeners[i]();
}

function fireResizeEvent() {
  var listeners = window.viewPolyfill.resizeEventListeners;
  for (var i = 0; i < listeners.length; i++)
    listeners[i]();
}

function updateViewportChanged() {
    var scrollChanged =
        window.viewPolyfill.offsetLeftSinceLastChange != window.view.offsetLeft ||
        window.viewPolyfill.offsetTopSinceLastChange != window.view.offsetTop;

    var sizeChanged =
        window.viewPolyfill.widthSinceLastChange != window.view.width ||
        window.viewPolyfill.heightSinceLastChange != window.view.height ||
        window.viewPolyfill.scaleSinceLastChange != window.view.scale;

    window.viewPolyfill.offsetLeftSinceLastChange = window.view.offsetLeft;
    window.viewPolyfill.offsetTopSinceLastChange = window.view.offsetTop;
    window.viewPolyfill.widthSinceLastChange = window.view.width;
    window.viewPolyfill.heightSinceLastChange = window.view.height;
    window.viewPolyfill.scaleSinceLastChange = window.view.scale;

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

if (window.view) {
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

    window.viewPolyfill = {
      "offsetLeftSinceLastChange": null,
      "offsetTopSinceLastChange": null,
      "widthSinceLastChange": null,
      "heightSinceLastChange": null,
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
          get offsetLeft() {
            if (isSafari) {
              // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
              return window.scrollX - (layoutDummy.getBoundingClientRect().left * this.scale + window.scrollX * this.scale);
            } else {
              return window.scrollX + layoutDummy.getBoundingClientRect().left;
            }
          },
          get offsetTop() {
            if (isSafari) {
              // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
              return window.scrollY - (layoutDummy.getBoundingClientRect().top * this.scale + window.scrollY * this.scale);
            } else {
              return window.scrollY + layoutDummy.getBoundingClientRect().top;
            }
          },
          get width() {
            var clientWidth = document.documentElement.clientWidth;
            if (isIEEdge) {
                // If there's no scrollbar before pinch-zooming, Edge will add
                // a non-layout-affecting overlay scrollbar. This won't be
                // reflected in documentElement.clientWidth so we need to
                // manually subtract it out.
                if (document.documentElement.clientWidth == window.viewPolyfill.unscaledInnerWidth
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
          get height() {
            var clientHeight = document.documentElement.clientHeight;
            if (isIEEdge) {
                // If there's no scrollbar before pinch-zooming, Edge will add
                // a non-layout-affecting overlay scrollbar. This won't be
                // reflected in documentElement.clientHeight so we need to
                // manually subtract it out.
                if (document.documentElement.clientHeight == window.viewPolyfill.unscaledInnerHeight
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
            return window.viewPolyfill.unscaledInnerWidth / window.innerWidth;
          },
          get pageLeft() {
            return window.scrollX;
          },
          get pageTop() {
            return window.scrollY;
          },
          "addEventListener": function(name, func) {
            // TODO: Match event listener semantics. i.e. can't add the same callback twice.
            if (name === 'scroll')
              window.viewPolyfill.scrollEventListeners.push(func);
            else if (name === 'resize')
              window.viewPolyfill.resizeEventListeners.push(func);
          }
        };

        window.view = viewport;
    });
}
