var canvasURL = 'https://yale.instructure.com';
var externalHomePageRedirects = {
  10184:3617,
  38082:3671
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

$(document).ready(function () {
  $("iframe").css('height','200%');
});