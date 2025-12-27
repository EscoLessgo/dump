/* Scroll Blur JS */
$(function () {
    // Generate content
    var $wrapper = $('.wrapper');
    var loremText = `Collaboratively administrate empowered markets via plug-and-play networks. Dynamically procrastinate B2C users after installed base benefits. Dramatically visualize customer directed convergence without revolutionary ROI. <br/> <br/> Efficiently unleash cross-media information without cross-media value. Quickly maximize timely deliverables for real-time schemas. Dramatically maintain clicks-and-mortar solutions without functional solutions.<br/><br/>Completely synergize resource sucking relationships via premier niche markets. Professionally cultivate one-to-one customer service with robust ideas. Dynamically innovate resource-leveling customer service for state of the art customer service.`;

    // Create 30 boxes
    for (var x = 0; x < 30; x++) {
        var $box = $('<div class="box"></div>');
        // Create 10 lorem paragraphs per box
        for (var y = 0; y < 10; y++) {
            $box.append('<div class="lorem">' + loremText + '</div>');
        }
        $wrapper.append($box);
    }

    var $box = $('.box'),
        $allButLastBox = $('.box:not(:last-child)'),
        inter = 30,
        speed = 0;

    var scrollTime = 1.2;
    var scrollDistance = 650;

    $box.last().on("mousewheel DOMMouseScroll", function (event) {
        // Allow propagation if at edges? 
        // The snippet says preventDefault. This locks scrolling to this box.
        // We'll keep it as requested.
        event.preventDefault();
        event.stopPropagation();

        var delta = event.originalEvent.wheelDelta / 120 || -event.originalEvent.detail / 3;
        var scrollTop = $box.last().scrollTop();
        var finalScroll = scrollTop - parseInt(delta * scrollDistance);

        animScroll();

        $allButLastBox.each(function (index, val) {
            TweenLite.to($(this), scrollTime, {
                scrollTo: {
                    y: finalScroll,
                    autoKill: true
                },
                ease: Power2.easeOut,
                overwrite: 5,
                delay: 0 + (index / 1600)
            });
        })

        TweenMax.to($box.last(), scrollTime, {
            scrollTo: {
                y: finalScroll,
                autoKill: true
            },
            ease: Power2.easeOut,
            onComplete: stoppedScroll,
            overwrite: 5
        });
    }).mousedown(function (event) {
        // Drag scrolling logic support?
        // event.preventDefault();
        // event.stopPropagation();

        // var scrollTop = $box.last().scrollTop();
        // stoppedScroll();

        // $allButLastBox.each(function(index, val) {
        //     TweenLite.set($(this), {
        //         scrollTo: {
        //             y: scrollTop,
        //             autoKill: true
        //         },
        //         ease: Power2.easeOut,
        //         overwrite: 5,
        //         delay: 0 + (index / 1600)
        //     });
        // })
    });

    // Sync scroll if drag-scrolling standard scrollbar (mousedown listener above was partial)
    $box.last().on('scroll', function () {
        // Since the effect relies on the delay, standard scrolling breaks the "blur" syncing.
        // The original snippet overrides wheel to force the Tween.
        // We'll leave it as is.
    });

    stoppedScroll();

    TweenMax.set($box.last(), {
        autoAlpha: 1,
        delay: 0
    });

    function stoppedScroll() {
        $allButLastBox.each(function (index, val) {
            TweenMax.set($(this), {
                autoAlpha: 0,
                delay: 0
            });
        });
    }

    function animScroll() {
        $allButLastBox.each(function (index, val) {
            TweenMax.set($(this), {
                autoAlpha: 0.001 + (0.010 * index),
                delay: 0
            });
        });
    }
});
