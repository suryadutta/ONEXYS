var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

function homepageQuery(studentID, courseID, course_title, callback){
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
        var module_progress = data[0].value[0],
            post_test_status = data[0].value[1],
            score = data[1].value[0],
            badges =  data[1].value[1],
            leaderboard = data[2].value[0],
            my_team = data[2].value[1],
            home_updates = data[3].value[0],
            home_vids = data[3].value[1],
            home_links = data[3].value[2],
            daily_yalie = data[4].value;

        function orderBadges(a,b) {
            if (a.Points < b.Points) return 1;
            if (a.Points > b.Points) return -1;
            return 0;
        }

        var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
        if (awarded_badges.length>3) awarded_badges = awarded_badges.slice(0,3);

        callback(module_progress, post_test_status, score, awarded_badges, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
    });
}

function homepageQueryMasquerade(studentID, courseID, course_title, callback){
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
        badges =  data[1].value[1],
        leaderboard = data[2].value[0],
        my_team = data[2].value[1],
        home_updates = data[3].value[0],
        home_vids = data[3].value[1],
        home_links = data[3].value[2],
        daily_yalie = data[4].value;

        function orderBadges(a,b) {
            if (a.Points < b.Points) return 1;
            if (a.Points > b.Points) return -1;
            return 0;
        }

        var awarded_badges = badges.filter(badge => badge.Awarded == true).sort(orderBadges);
        if (awarded_badges.length>3) awarded_badges = awarded_badges.slice(0,3);

        callback(module_progress, post_test_status, score, awarded_badges, leaderboard, my_team, home_updates, home_vids, home_links, daily_yalie);
    });
}

function homepageAdminQuery(courseID, course_title, callback){
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
            leaderboard = data[1].value,
            home_updates = data[2].value[0],
            home_vids = data[2].value[1],
            home_links = data[2].value[2],
            students = data[3],
            daily_yalie = data[4].value;
        //console.log("Leaderboard: " + leaderboard);
        console.log(data);
        console.log(students);
        callback(module_progress, {open: true, locked: false, tooltip: "The Post Test is always open for Admins for testing purposes. Masquerade as a student to see how it normally looks."}, leaderboard, home_updates, home_vids, home_links, students, daily_yalie);
    });
}

function badgesQuery(studentID, courseID, callback) {
    canvas.getIndScoreAndBadges(studentID, courseID, function(err, totalPoints, badges) {
        callback(badges);
    });
}

function badgesAdminQuery(courseID, callback) {
    mongo.getAllData(courseID, function(mongo_data){
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
