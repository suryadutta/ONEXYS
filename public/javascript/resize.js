$(document).ready(function() {
    $("textarea").css('transform', 'height .75s ease-in-out');
    $("textarea").animate({
        height: '120px'
    }, {
        duration: 10,
        easing: 'swing',
    });

    $("textarea").focus(function() {
        //console.log("Expanding to focused size");
        $(this).animate({
            height: (Math.max(120, this.scrollHeight + 20) + 'px')
        }, {
            duration: 500,
            easing: 'swing',
        });
    });

    $("textarea").focusout(function() {
        //console.log("Shrinking to non-focused size");
        $(this).animate({
            height: '120px'
        }, {
            duration: 500,
            easing: 'swing',
        });
    });

    // This last method is a little buggy. Still working on it - gmf
    $("textarea").on('keyup', function() {
        //console.log("Live height increase");
        $(this).animate({
            height: (Math.max(120, this.scrollHeight + 1) + 'px')
        }, {
            duration: 250,
            easing: 'swing',
        });
    });
});
