var bottomBar;
var viewport;

window.addEventListener('load', function() {
    bottomBar = document.getElementById('bottombar');
    barcontent = document.getElementById('barcontent');
    viewport = window.visualViewport;
    layoutViewportElement = document.getElementById('layoutInvisible');
    var borderWidth = 6;
    var barHeight = bottomBar.getBoundingClientRect().height;

    function viewportChangeHandler()
    {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetX = viewport.pageX;
        var offsetY = viewport.pageY + viewport.clientHeight - barHeight;

        bottomBar.style.left = offsetX + 'px';
        bottomBar.style.top = offsetY + 'px';
        bottomBar.style.transform = 'scale(' + 1/viewport.scale + ')';
    };

    viewport.addEventListener('scroll', viewportChangeHandler);
    viewport.addEventListener('resize', viewportChangeHandler);

    viewportChangeHandler();
});
