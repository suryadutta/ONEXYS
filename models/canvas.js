var config = require('../bin/config');
var auth = require('../bin/auth');
var request = require('request');
var asyncStuff = require('async');
var async = require('async');
var mongo = require('./mongo');

// The number of points granted to a student for each
// daily task they have completed.
var daily_task_point_worth = 50;

var add_page_number = (url) => {
    if(url.indexOf("?")>-1){
        return url+'&per_page='+String(config.canvasPageResults);
    } else{
        return url+'?per_page='+String(config.canvasPageResults);
    }
}

var assignment_user_url = (studentID, courseID) => {
    return config.canvasURL + '/api/v1/courses/' + courseID + '/students/submissions?student_ids[]=' + studentID;
    //return config.canvasURL + '/api/v1/courses/' + courseID + '/students/submissions?student_ids[]=' + studentID;
}

var notes_column_url = (courseID) => {
    return config.canvasURL + '/api/v1/courses/' + courseID + '/custom_gradebook_columns/';
}

var get_update_url = (courseID, callback) => {
    getAdminRequest(notes_column_url(courseID), function(err, custom_columns){
        var points_id = custom_columns.find(column => column.title='Notes').id;
        var update_url = config.canvasURL + '/api/v1/courses/' + courseID + '/custom_gradebook_columns/' + points_id + '/data';
        callback(update_url);
    });
}

var sections_url = (courseID) => {
    return config.canvasURL + '/api/v1/courses/' + courseID + '/sections?include=students';
}

var student_url = (courseID) => {
    return config.canvasURL + '/api/v1/courses/' + courseID + '/users?enrollment_type=student';
}

// To get the daily tasks, we're going to get all the assignments and look for the ones which
// have been designated as daily tasks in the Admin Panel.
var daily_task_url = (courseID) => {
    return config.canvasURL + '/api/v1/courses/'+ courseID+ '/assignments?per_page=100';
}

function getRequest(url, userID, callback) {
    url = add_page_number(url);
    auth.authTokenQueue.push(userID, function(auth_token){
        request.get({
            url: url,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
        }, function(error, response, body) {
            callback(null, JSON.parse(body));
        });
    });
} //user GET request

function postRequest(url, userID, parameters, callback) {
    url = add_page_number(url);
    auth.authTokenQueue.push(userID,function(auth_token){
        request.post({
            url: url,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
            form: parameters,
        }, function(error, response, body) {
            callback(null, JSON.parse(body));
        });
    });
} //user POST request

function putRequest(url, userID, parameters, callback) {
    url = add_page_number(url);
    auth.authTokenQueue.push(userID,function(auth_token){
        request.put({
            url: url,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
            form: parameters,
        }, function(error, response, body) {
            callback(null, JSON.parse(body));
        });
    });
} //user PUT request

function getAdminRequest(url, callback) {
    url = add_page_number(url);
    request.get({
        url: url,
        headers: {
            "Authorization": " Bearer " + config.canvasAdminAuthToken
        },
    }, function(error, response, body) {
        callback(null, JSON.parse(body));
    });
} //admin GET request

function postAdminRequest(url, parameters, callback) {
    url = add_page_number(url);
    request.post({
        url: url,
        headers: {
            "Authorization": " Bearer " + config.canvasAdminAuthToken
        },
        form: parameters,
    }, function(error, response, body) {
        callback(null, JSON.parse(body));
    });
} //admin POST request

function putAdminRequest(url, parameters, callback) {
    url = add_page_number(url);
    request.put({
        url: url,
        headers: {
            "Authorization": " Bearer " + config.canvasAdminAuthToken
        },
        form: parameters,
    }, function(error, response, body) {
        callback(null, JSON.parse(body));
    });
} //admin PUT request


module.exports = {
    getRequest,
    postRequest,
    putRequest,
    getAdminRequest,
    postAdminRequest,
    putAdminRequest,
}
