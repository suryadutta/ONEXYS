
// URL of the canvas site used for the course
var canvasURL = 'https://curryvirginia.instructure.com';

// Mapping of course IDs to external tool IDs.
var externalHomePageRedirects = {
    // courseId:toolId

    // CONEX Blue redirect
    2517:170
};

var homeRegex = new RegExp('^/courses/([0-9]+)/?$');
if (homeRegex.test(window.location.pathname)) {
    console.log("Successful regex")
    // On the course homepage
    var matches = homeRegex.exec(window.location.pathname);
    var courseId = matches[1];
    if(courseId in externalHomePageRedirects){
        console.log("Found id: " + courseId)
        window.location.replace(canvasURL+'/courses/'+courseId+'/external_tools/'+externalHomePageRedirects[courseId]);
    }
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
