var config = require('../bin/config');
var request = require('request');
var asyncStuff = require('async');
var canvas = require('./canvas');
var mongo = require('./mongo');

/**
 * @admin boolean, whether the query is from an admin or not
 * @masquerade_id the id of the person who requested the page or the user to masquerade
 * @courseID int, id of the current canvas course
 * @courseTitle string, the name of the current canvas course
 * @callback callback function to be executed after everything is over
**/
function getHomepage(admin, masquerade_id, courseID, courseTitle, callback) {
    // Validate input
    assert(/(true)|(false)/.test(admin));
    assert(/\d+/.test(masquerade_id));
    assert(/\d+/.test(courseID));

    // Use admin boolean to control whether to send the students array (to fill dropdown)

    // Get data based on the id provided by masquerade_id

}

function getBadges(admin, masquerade_id, courseID, callback) {
    // Use admin boolean to control existence of the students dropdown

    // Get badges based on the user from masquerade_id

}

module.exports = {
    getHomepage,
    getBadges,
}
