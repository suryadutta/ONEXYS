$("a.ic-app-header__logomark").css("background-image", "none"); // Clear out default Canvas logo in top left
$("a.ic-app-header__logomark").css("background-color", "inherit"); // Force background color to smooth with the rest of the sidebar
$("a.home").hide(); // Hide the "Home" button on the left navigation bar

// Specify which Heroku application you're going to be working with.
// This is included here so we can query it for what image needs to be displayed in the top left of Canvas!
const herokuInstance = "http://localhost:3000"; // NO TRAILING SLASH



// Mapping of course IDs to external tool IDs.
var externalHomePageRedirects = { // courseId:toolId
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
    var matches = homeRegex.exec(window.location.pathname);
    courseId = matches[1]; // Get course ID

    if($("a.home").hasClass("active") && courseId in externalHomePageRedirects) {
        window.location.replace('https://' + window.location.hostname + '/courses/' + courseId + '/external_tools/' + externalHomePageRedirects[courseId]);
    } else {
        $.get(herokuInstance + "/api/site-info", {
            hostname: window.location.hostname,
            course: courseId,
        }).always((data, status) => {
            console.log("Replace logo");
            $('.ic-app-header__logomark').css("background-image", "url(" + data.logo + ")"); // Replace logo
        });
    }

} else { // Not inside of a specific course, so load the generic account image.
    $.get(herokuInstance + "/api/site-info", {
        hostname: window.location.hostname,
        course: "0000", // Signify that we want generic domain level settings, not a specific track's info
    }).always((data, status) => {
        console.log("Use static logo");
        $('.ic-app-header__logomark').css("background-image", "url(" + data.logo + ")"); // Replace logo
    });
}

/*
*
    Removed by Abhi Nayar, 07/12/2018
    The 200% height on iframe is making the black border around videos appear.
    If this is a breaking change, simply uncomment.

    $(document).ready(function () {
        $("iframe").css('height','200%');
    });
*/
