var bottomBar;
var viewport;

window.addEventListener('load', function() {
    bottomBar = document.getElementById('bottombar');
    barcontent = document.getElementById('barcontent');
    viewport = window.visualViewport;
    layoutViewportElement = document.getElementById('layoutInvisible');

    function viewportChangeHandler()
    {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetX = viewport.scrollLeft;
        var offsetY = layoutViewportElement.getBoundingClientRect().height
                    - viewport.clientHeight
                    - viewport.scrollTop;

        bottomBar.style.left = offsetX + 'px';
        bottomBar.style.bottom = offsetY + 'px';
        bottomBar.style.width = 100 * viewport.scale + '%';

        bottomBar.style.transform = 'scale(' + 1/viewport.scale + ')';
    };

    viewport.addEventListener('scroll', viewportChangeHandler);
    viewport.addEventListener('resize', viewportChangeHandler);

    viewportChangeHandler();
});
