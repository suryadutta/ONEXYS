
// Replace the logo in the top left of Canvas with a custom one
//$('.ic-app-header__logomark').css("background-image", "url(https://i.gyazo.com/46410a59a873b83687e1c83ae7064582.png)");
$('.ic-app-header__logomark').css("background-color", "white");
if (id==3559){
    $('.ic-app-header__logomark').css("background-image", "url(https://github.com/UVAMobileDev/ONEXYS/blob/master/public/images/logo/smithLogoWhiteTransparent2.png?raw=true");}
else {
    $('.ic-app-header__logomark').css("background-image", "url(https://github.com/UVAMobileDev/ONEXYS/blob/master/public/images/logo/institutionIcon.png?raw=true");
}



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

var homeRegex = new RegExp('^/courses/([0-9]+)/?$');
if (homeRegex.test(window.location.pathname)) {
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
