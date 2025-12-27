/* Motion Blur JS */

$(document).ready(function () {
    // Generate boxes
    for (var x = 0; x < 30; x++) {
        $('body').append('<div class="box"></div>');
    }

    /* 
    * I will keep publishing examples to help push the web foward.
    * PLEASE Like, Heart or Share if you like, and don't forget to follow. 
    * Thanks.
    *
    * Now let's animate it :)
    */

    var $box = $('.box'),
        inter = 30,
        speed = 0;

    function moveBox(e) {
        $box.each(function (index, val) {
            TweenLite.to($(this), 0.05, { css: { left: e.pageX, top: e.pageY }, delay: 0 + (index / 750) });
        });
    }

    $(window).on('mousemove', moveBox);

    $box.each(function (index, val) {
        index = index + 1;
        TweenMax.set(
            $(this), {
            autoAlpha: 1,
            delay: 0
        });
    });

    // Fix: .text not found in snippet, assuming box or just safely ignoring
    TweenMax.set(
        $('.text:nth-child(30)'), {
        autoAlpha: 1,
        delay: 0
    }
    );

    // Event listeners for styling (optional, kept if user brings back UI or wants custom triggers)
    // Removed specific UI dependent code to prevent errors
});
