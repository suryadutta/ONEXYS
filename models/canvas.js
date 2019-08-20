var config = require('../bin/config'),
    auth = require('../bin/auth'),
    request = require('request'),
    mongo = require('./mongo'),
    async = require('async');

// 1. Get the list of assignments from Mongo
// 2. Get the list of assignments from Canvas
// 3. Pull out Canvas assignments which are in the Mongo list
// 4. Return the one with the smallest, but still in the future, due date
function getDailyTask(courseID, callback) {
    async.parallel([
        async.reflect(callback => {
            mongo.getDailyTasks(courseID, (err, data) => {
                var arr = [];
                data.forEach(asn => arr.push(asn.assignment_id));
                callback(err, arr);
            });
        }),
        async.reflect(callback => {
            getAdminRequest(dailyTaskUrl(courseID), (err, data) => callback(err, data));
        }),
    ], (err, data) => {
        var daily = {id: null, due: new Date(86400000000000)}, // create max date
            now = new Date();
        try {
            data[1].value.forEach(asn => {
                if(data[0].value.includes(asn.id)) { // If it's not a daily assignment, forget it
                    var asn_date = new Date(asn.due_at);
                    if(asn_date <= daily.due && asn_date > now) { // Make it the new daily assignment if it's due sooner than the previous daily assignment, but still due in the future
                        daily.id = asn.id;
                        daily.due = asn_date;
                    }
                }
            });
        } catch(e) { console.log(e); }
        callback(err, daily);
    });
}



































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
var dailyTaskUrl = (courseID) => {
    return config.canvasURL + '/api/v1/courses/'+ courseID+ '/assignments';
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
}
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
}
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
}
function getAdminRequest(url, callback) {
    url = add_page_number(url);
    request.get({
        url: url,
        headers: {
            "Authorization": " Bearer " + config.canvasAdminAuthToken
        },
    }, function(error, response, body) {
        callback(error, JSON.parse(body));
    });
}
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
}
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
}

module.exports = {
    getDailyTask,
}
