var canvasURL = 'https://curryvirginia.instructure.com';
var externalHomePageRedirects = {
  10184:3673,
  38082:3671,
  38081:3817,
  38080:3819,
  38083:3820
  //add all ids after adding apps
};

var homeRegex = new RegExp('^/courses/([0-9]+)/?$');
if (homeRegex.test(window.location.pathname)) {
  // On the course homepage
  var matches = homeRegex.exec(window.location.pathname);
  var courseId = matches[1];
  if(courseId in externalHomePageRedirects){
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
