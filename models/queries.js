var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

function homepageQuery(studentID, courseID, course_title, callback) {
    console.log("homepageQuery()")
    asyncStuff.parallel([
        asyncStuff.reflect(callback => {
            canvas.getStudentProgress(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getIndScoreAndBadges(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getLeaderboardScores(studentID, courseID, course_title, callback);
        }),
        asyncStuff.reflect(callback => {
            mongo.getHomeContent(courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getNextDailyYalie(courseID, callback);
        })
    ], (err, data) => {
        console.log("asyncStuff.parallel() complete, beginning callback...")
        var module_progress = data[0].value[0],
            post_test_status = data[0].value[1],
            score = data[1].value[0],
            badges = data[1].value[1],
            leaderboard = data[2].value[0],
            my_team = data[2].value[1],
            home_updates = data[3].value[0],
            home_vids = data[3].value[1],
            home_links = data[3].value[2],
            daily_yalie = data[4].value;

        function orderBadges(a, b) {
            if (a.Points < b.Points) return 1;
            if (a.Points > b.Points) return -1;
            return 0;
        }

        var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
        if (awarded_badges.length > 3) awarded_badges = awarded_badges.slice(0, 3);
        callback(module_progress, post_test_status, score, awarded_badges, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
        console.log("homepageQuery() callback called")
    });
}

function homepageQueryMasquerade(studentID, courseID, course_title, callback) {
    console.log("homepageQueryMasquerade()")
    asyncStuff.parallel([
        asyncStuff.reflect(callback => {
            canvas.getStudentProgress_masquerade(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getIndScoreAndBadges_masquerade(studentID, courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getLeaderboardScores_masquerade(studentID, courseID, course_title, callback);
        }),
        asyncStuff.reflect(callback => {
            mongo.getHomeContent(courseID, callback);
        }),
        asyncStuff.reflect(callback => {
            canvas.getNextDailyYalie(courseID, callback);
        })
    ], (err, data) => {
        var module_progress = data[0].value[0],
            post_test_status = data[0].value[1],
            score = data[1].value[0],
            badges = data[1].value[1],
            leaderboard = data[2].value[0],
            my_team = data[2].value[1],
            home_updates = data[3].value[0],
            home_vids = data[3].value[1],
            home_links = data[3].value[2],
            daily_yalie = data[4].value;
        
        function orderBadges(a, b) {
            if (a.Points < b.Points) return 1;
            if (a.Points > b.Points) return -1;
            return 0;
        }

        var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
        if (awarded_badges.length > 3) awarded_badges = awarded_badges.slice(0, 3);

        callback(module_progress, post_test_status, score, awarded_badges, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
        console.log("homepageQueryMasquerade() callback called")
    });
}

function homepageAdminQuery(courseID, course_title, callback) {
    console.log("homepageAdminQuery()")
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

        var module_progress = data[0].value,
            post_test_status = {},
            leaderboard = data[1].value,
            home_updates = data[2].value[0],
            home_vids = data[2].value[1],
            home_links = data[2].value[2],
            students = data[3].value,
            daily_yalie = data[4].value;

            // The code below (aside from the callback) was written to give admins the same post test view a student would have
            // if the post test is open, it will result in a different background from being shown on the home page
            // TODO: find a better way to parse the string to actual boolean
            post_test_status.open = data[2].value[0].post_test == 'true' ? true : false;
            post_test_status.tooltip = '';
            if (post_test_status.open) {
                post_test_status.locked = false;
            }
            else {
                post_test_status.tooltip = 'Complete all Practices and Applications in order to be eligible for the Post Test!';
                post_test_status.locked = true;
            }

        // Place the following code in the 2nd paramter in the callback below for
        // the post test to always be available for admins: 
        // { open: true, locked: false, tooltip: "The Post Test is always open for Admins for testing purposes. Masquerade as a student to see how it normally looks." }
        callback(module_progress, post_test_status, leaderboard, home_updates, home_vids, home_links, students, daily_yalie);
        console.log("homepageAdminQuery() callback called")
    });
}

function badgesQuery(studentID, courseID, callback) {
    canvas.getIndScoreAndBadges(studentID, courseID, function (err, totalPoints, badges) {
        callback(badges);
    });
}

function badgesAdminQuery(courseID, callback) {
    mongo.getAllData(courseID, function (mongo_data) {
        callback(mongo_data.badges);
    });
}

module.exports = {
    homepageQuery,
    homepageQueryMasquerade,
    homepageAdminQuery,
    badgesQuery,
    badgesAdminQuery
}
