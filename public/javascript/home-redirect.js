$("a.home").hide(); // Hide the "Home" button on the left navigation bar

// URL of the canvas site used for the course
var canvasURL = 'https://curryvirginia.instructure.com';

// Mapping of course IDs to external tool IDs.
var externalHomePageRedirects = {
    // courseId:toolId

    // CONEX Blue redirect
    2517:170,

    // CONEX Orange redirect
    3528:207,

    // CONEX White redirect
    3529:214,

    // CONEX Coach Demo Blue
    3559:227
};

var homeRegex = new RegExp('^/courses/([0-9]+)/{0,1}.*$'), courseId = null;
if(homeRegex.test(window.location.pathname)) {
    console.log("Setting ID");
    var matches = homeRegex.exec(window.location.pathname);
    courseId = matches[1]; // Get course ID

    if($("a.home").hasClass("active") && courseId in externalHomePageRedirects) {
        console.log("Active");
        window.location.replace('https://' + window.location.hostname + '/courses/' + courseId + '/external_tools/' + externalHomePageRedirects[courseId]);
    }
}

// Replace the logo in the top left of Canvas with a custom one
$('.ic-app-header__logomark').css("background-color", "white"); // Set logo background to white (for transparent images)
$('.ic-app-header__logomark').css("background-image", ""); // Clear image (prevent color flashing on page loading)

if(courseId == 3559){
    $('.ic-app-header__logomark').css("background-image", "url(https://github.com/UVAMobileDev/ONEXYS/blob/master/public/images/logo/smithLogoWhiteTransparent2.png?raw=true");
} else {
    $('.ic-app-header__logomark').css("background-image", "url(https://github.com/UVAMobileDev/ONEXYS/blob/master/public/images/logo/institutionIcon.png?raw=true");
}

console.log($("form.hide").prop("action"));

/*
*
    Removed by Abhi Nayar, 07/12/2018
    The 200% height on iframe is making the black border around videos appear.
    If this is a breaking change, simply uncomment.

    $(document).ready(function () {
        $("iframe").css('height','200%');
    });
*/
