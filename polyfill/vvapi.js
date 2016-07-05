var bottomBar;
var viewport;

window.addEventListener('load', function() {
    bottomBar = document.getElementById('bottombar');
    viewport = window.visualViewport;
    layoutViewportElement = document.getElementById('layoutInvisible');

    function viewportChangeHandler()
    {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        var offsetX = viewport.scrollLeft;
        var offsetY = viewport.clientHeight
                    - layoutViewportElement.getBoundingClientRect().height
                    + viewport.scrollTop;

        bottomBar.innerHTML = "innerWidth: " + window.innerWidth + " outerWidth: " +
            window.outerWidth;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        var str = 'translate(' + 
                                    offsetX + 'px,' +
                                    offsetY + 'px) ' +
                                    'scale(' + 1/viewport.scale + ')';
        bottomBar.style.transform = str;
    };

    viewport.addEventListener('scroll', viewportChangeHandler);
    viewport.addEventListener('resize', viewportChangeHandler);
});
