var courseIDFromURL = null;
if(/(https|http):\/\/.*.instructure.com.courses\/(\d+)\/?.*/.test(window.location.href))
    courseIDFromURL = /(https|http):\/\/.*.instructure.com.courses\/(\d+)\/?.*/.exec(window.location.href)[2];
