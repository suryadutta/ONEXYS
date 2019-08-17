var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

function homepageQuery(studentID, courseID, course_title, masquerade, callback){
    asyncStuff.parallel([
        asyncStuff.reflect(callback => {
            if(masquerade) canvas.getStudentProgress_masquerade(studentID, courseID, callback);
            else canvas.getStudentProgress(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            if(masquerade) canvas.getIndScoreAndBadges_masquerade(studentID, courseID, callback);
            else canvas.getIndScoreAndBadges(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            if(masquerade) canvas.getLeaderboardScores_masquerade(studentID, courseID, course_title, callback);
            else canvas.getLeaderboardScores(studentID, courseID, course_title, callback);
        }),
        asyncStuff.reflect(callback => {
            mongo.getHomeContent(courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getNextDailyYalie(courseID, callback);
        })
    ], (err, data) => {
        var awarded_badges = data[1].value[1].filter(badge => badge.Awarded == true).sort( (a, b) => {
            return (a.Points < b.Points) ? 1 : ( (a.Points > b.Points) ? -1 : 0);
        });
        if (awarded_badges.length>3) awarded_badges = awarded_badges.slice(0,3);
        callback([data[0].value[0], data[0].value[1], data[1].value[0], awarded_badges, data[2].value[0], data[2].value[1], data[3].value[0], data[3].value[1], data[3].value[2], data[4].value]);
    });
}

function homepageAdminQuery(courseID, course_title, callback) {
    asyncStuff.parallel([
        asyncStuff.reflect(callback => {
            mongo.getAllData(courseID, mongo_data => callback(null, mongo_data.modules));
        }),
        asyncStuff.reflect(callback => {
            canvas.getAdminLeaderboardScores(courseID, course_title, callback);
        }),
        asyncStuff.reflect(callback => {
            mongo.getHomeContent(courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getStudents(courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getNextDailyYalie(courseID, callback);
        })
    ], (err, data) => {
        callback([data[0].value, {open: true, locked: false, tooltip: "The Post Test is always open for Admins for testing purposes. Masquerade as a student to see how it normally looks."}, data[1].value, data[2].value[0], data[2].value[1], data[2].value[2], data[3].value, data[4].value]);
    });
}

function badgesQuery(studentID, courseID, callback) {
    canvas.getIndScoreAndBadges(studentID, courseID, (err, totalPoints, badges) => {
        callback(badges);
    });
}

function badgesAdminQuery(courseID, callback) {
    mongo.getData(courseID, "badges", (err, mongo_data) => {
        callback(mongo_data.badges);
    });
}

/**
 * @admin boolean, whether the query is from an admin or not
 * @masquerade dict: .bool whether the req is a masquerade; id: the id of the student to masquerade
 * @courseID int, id of the current canvas course
 * @courseTitle string, the name of the current canvas course
 * @callback
 *
 *
 *
 *
 *
 *
**/
function getHomepage(admin, masquerade, courseID, courseTitle, callback) {

}

module.exports = {
    homepageQuery,
    //homepageQueryMasquerade,
    homepageAdminQuery,
    badgesQuery,
    badgesAdminQuery,
}
