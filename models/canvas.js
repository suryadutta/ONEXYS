var config = require('../bin/config');
var auth = require('../bin/auth');
var request = require('request');
var asyncStuff = require('async');
var mongo = require('./mongo');

// The number of points granted to a student for each
// daily task they have completed.
var daily_task_point_worth = 50;

var add_page_number = (url) => {
    if (url.indexOf("?") > -1) {
        return url + '&per_page=' + String(config.canvasPageResults);
    } else {
        return url + '?per_page=' + String(config.canvasPageResults);
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
    getAdminRequest(notes_column_url(courseID), function (err, custom_columns) {
        var points_id = custom_columns.find(column => column.title = 'Notes').id;
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
    return config.canvasURL + '/api/v1/courses/' + courseID + '/assignments?per_page=100';
}

function getRequest(url, userID, callback) {
    url = add_page_number(url);
    console.log("Get ", url);
    auth.authTokenQueue.push(userID, function (authErr, auth_token) {
        request.get({
            url: url, //'http://httpstat.us/200?sleep=15000', //url for testing timeouts. Sleep parameter is the time before a response is sent.
            timeout: 10000,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
        }, function (error, response, body) {
            console.log('AUTH TOKEN ERROR: ', authErr)
            if (error) { // make sure error is truthy before testing for error.code
                if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') { //timeout codes
                    console.log('Canvas request timed out at: ', url)
                    callback(error, null)
                }
                else { //other errors
                    console.log('ERROR: ', error)
                    callback(error, null)
                }
            }
            else if (authErr) { //auth token related errors
                console.log("Authentication Error: ", authErr);
                callback(authErr, null)
            }
            else callback(null, JSON.parse(body));
        });
    });
} //user GET request

function postRequest(url, userID, parameters, callback) {
    url = add_page_number(url);
    auth.authTokenQueue.push(userID, function (auth_token) {
        request.post({
            url: url,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
            form: parameters,
        }, function (error, response, body) {
            callback(null, JSON.parse(body));
        });
    });
} //user POST request

function putRequest(url, userID, parameters, callback) {
    url = add_page_number(url);
    auth.authTokenQueue.push(userID, function (auth_token) {
        request.put({
            url: url,
            headers: {
                "Authorization": " Bearer " + auth_token,
            },
            form: parameters,
        }, function (error, response, body) {
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
    }, function (error, response, body) {
        //console.log("getAdminRequest() body:")
        //console.log(body)
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
    }, function (error, response, body) {
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
    }, function (error, response, body) {
        callback(null, JSON.parse(body));
    });
} //admin PUT request

function computeScoreAndBadges(studentID, courseID, callback) { // Return score and badges
    console.log("Getting Scores!");
    mongo.getAllData(courseID, function (mongo_data) {
        var badges = mongo_data.badges;
        var totalPoints = 0;
        var practice_proficient = 0;
        var quizzes_attempted = 0;
        var daily_done = 0;
        var reflections_done = 0;

        if (mongo_data.lucky_bulldogs.length > 0) {
            for (lucky_bulldog of mongo_data.lucky_bulldogs) {
                if (lucky_bulldog.awarded_ids.includes(studentID)) {
                    totalPoints += parseInt(lucky_bulldog.point_value);
                }
            }
        }

        function awardBadge(badgeID) {
            badge_info = mongo_data.badges.find(badge => badge._id == badgeID);
            totalPoints += parseInt(badge_info.Points);
            badges[badges.indexOf(badge_info)].Awarded = true;
        }

        function sortLeaderboardScores(a, b) {
            if (a.score < b.score)
                return 1;
            if (a.score > b.score)
                return -1;
            return 0;
        }
        // callback(null, totalPoints, badges);
        // return;
        getRequest(assignment_user_url(studentID, courseID), studentID, function (err, data) {
            //console.log('get asignment user data: ')
            //console.log(data);
            if (err) {
                //rather than relying on Canvas, get data from Mongo
                mongo.getStudentData(courseID, 'studentScoreAndBadges', (mongoErr, data) => {
                    if (mongoErr) {
                        callback(err, 0, badges);
                    }
                    else {
                        let studentData = data.find(student => student._id == studentID);
                        callback(null, studentData.totalPoints, studentData.badges)
                    }
                    return;
                })
            } else if (data.status == "unauthorized") {
                console.log('User unauthorized');
                callback('User unauthorized', 0, badges);
            } else if (data.error) {
                console.log(data.error);
                callback(data.error, 0, badges);
            } else if (data.length < 1) {
                console.log('No Assignment Data Recorded');
                callback(null, 0, badges);
            } else {
                for (var i = 0; i < mongo_data.dailies.length; i++) {
                    var daily_obj = data.find(daily => daily.assignment_id == (mongo_data.dailies[i]).assignment_id);

                    if (daily_obj) {
                        var daily_grade = parseFloat(daily_obj.grade);
                        if (daily_grade > parseFloat(0)) {
                            daily_done += 1;
                        }
                    }
                }
                totalPoints += (parseInt(daily_done) * daily_task_point_worth); //assign points for each daily
                //assign points for each badge earned
                if (daily_done >= 1) {
                    awardBadge(1);
                }
                if (daily_done >= 5) {
                    awardBadge(2);
                }
                if (daily_done >= 10) {
                    awardBadge(3);
                }
                if (daily_done >= 15) {
                    awardBadge(4);
                }
                if (daily_done >= 20) {
                    awardBadge(5);
                }
                if (daily_done >= 25) {
                    awardBadge(6);
                }

                // Award Inspirer Badge if there's an entry in the gradebook
                var inspirer = mongo_data.badges.find(badge => badge._id == 32);
                if (inspirer && inspirer.assignment_id) { // Without an ID, just stop
                    var inspirerAsn = data.find(asn => asn.assignment_id == inspirer.assignment_id);
                    if (inspirerAsn) { // Without a valid assignment, just stop
                        inspirerAsn.grade = parseFloat(inspirerAsn.grade);
                        if (!isNaN(inspirerAsn.grade) && inspirerAsn.grade > 0) awardBadge(32); // Verify they have some score
                    }
                }

                for (var i = 0; i < mongo_data.modules.length; i++) {
                    if (mongo_data.modules[i].open == 'true') {

                        //practice objectives proficient
                        var practice_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).practice_link);

                        if (practice_object) {
                            var practice_grade = parseFloat(practice_object.grade);
                            if (practice_grade >= parseFloat(mongo_data.modules[i].practice_cutoff)) {

                                practice_proficient += 1;

                                //Process Practice Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.practice_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.practice_early_bird = studentID.toString();
                                    awardBadge(26);
                                } else {
                                    if (mongo_data.modules[i].leaderboard.practice_early_bird == studentID.toString()) {
                                        awardBadge(26);
                                    }
                                }

                                //Process Practice Leaderboard

                                if (mongo_data.modules[i].leaderboard.practice_leaderboard.find(placement => placement.student_id == studentID)) {
                                    //user is already on leaderboard
                                    awardBadge(20);
                                    user_index = mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID)
                                    mongo_data.modules[i].leaderboard.practice_leaderboard[user_index] = {
                                        'student_id': studentID.toString(),
                                        'score': practice_grade
                                    }
                                    mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                    if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                        //user is top on leaderboard
                                        awardBadge(21);
                                    }

                                } else {
                                    // Process leaderboard if not full - add user automatically
                                    if (mongo_data.modules[i].leaderboard.practice_leaderboard.length < 10) {
                                        mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                                            'student_id': studentID.toString(),
                                            'score': practice_grade
                                        });
                                        awardBadge(20);
                                        mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                        if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                            //user is top on leaderboard
                                            awardBadge(21);
                                        }
                                    } else {
                                        //user not on full leaderboard - compare scores and update
                                        mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                        if (practice_grade > mongo_data.modules[i].leaderboard.practice_leaderboard[mongo_data.modules[i].leaderboard.practice_leaderboard.length - 1].score) {
                                            mongo_data.modules[i].leaderboard.practice_leaderboard.pop()
                                            mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                                                'student_id': studentID.toString(),
                                                'score': practice_grade
                                            });
                                            awardBadge(20);
                                            mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                            if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                                //user is top on leaderboard
                                                awardBadge(21);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //quizzes attempted
                        var quiz_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).quiz_link);
                        if (quiz_object) {
                            var quiz_grade = parseFloat(quiz_object.grade);
                            if (quiz_grade > parseFloat(0)) {
                                quizzes_attempted += 1;

                                //Process Quiz Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.quiz_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.quiz_early_bird = studentID.toString();
                                    awardBadge(24);
                                    mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i],
                                        function (err, result) { });
                                } else {
                                    if (mongo_data.modules[i].leaderboard.quiz_early_bird == studentID.toString()) {
                                        awardBadge(24);
                                    }
                                }

                                //Process Quiz Leaderboard

                                if (mongo_data.modules[i].leaderboard.quiz_leaderboard.find(placement => placement.student_id == studentID)) {
                                    //user is already on leaderboard
                                    awardBadge(22);
                                    user_index = mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID)
                                    mongo_data.modules[i].leaderboard.quiz_leaderboard[user_index] = {
                                        'student_id': studentID.toString(),
                                        'score': quiz_grade
                                    }
                                    mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                    if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                        //user is top on leaderboard
                                        awardBadge(23);
                                    }

                                } else {
                                    // Process leaderboard if not full - add user automatically
                                    if (mongo_data.modules[i].leaderboard.quiz_leaderboard.length < 10) {
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                                            'student_id': studentID.toString(),
                                            'score': quiz_grade
                                        });
                                        awardBadge(22);
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                        if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                            //user is top on leaderboard
                                            awardBadge(23);
                                        }
                                    } else {
                                        //user not on full leaderboard - compare scores and update
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                        if (quiz_grade > mongo_data.modules[i].leaderboard.quiz_leaderboard[mongo_data.modules[i].leaderboard.quiz_leaderboard.length - 1].score) {
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard.pop()
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                                                'student_id': studentID.toString(),
                                                'score': quiz_grade
                                            });
                                            awardBadge(22);
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                            if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                                //user is top on leaderboard
                                                awardBadge(23);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //number of reflections
                        var reflection_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).reflection_link);
                        if (reflection_object) {
                            var reflection_grade = parseFloat(reflection_object.grade);
                            if (reflection_grade == parseFloat(100)) {
                                reflections_done += 1;

                                //Process Reflection Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.reflection_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.reflection_early_bird = studentID.toString();
                                    awardBadge(25);
                                    mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i],
                                        function (err, result) { });
                                } else {
                                    if (mongo_data.modules[i].leaderboard.reflection_early_bird == studentID.toString()) {
                                        awardBadge(25);
                                    }
                                }
                            }
                        }
                        mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i], function (err, result) { });
                    }
                }


                totalPoints += (parseInt(practice_proficient) * 100); //assign points for each proficient ALEKS
                //assign points for each badge earned
                if (practice_proficient >= 1) {
                    awardBadge(7);
                }
                if (practice_proficient >= 3) {
                    awardBadge(8);
                }
                if (practice_proficient >= 7) {
                    awardBadge(9);
                }
                if (practice_proficient >= 10) {
                    awardBadge(10);
                }


                totalPoints += (parseInt(quizzes_attempted) * 100); //assign points for each quiz
                //assign points for each badge earned
                if (quizzes_attempted >= 1) {
                    awardBadge(11);
                }
                if (quizzes_attempted >= 3) {
                    awardBadge(12);
                }
                if (quizzes_attempted >= 7) {
                    awardBadge(13);
                }
                if (quizzes_attempted >= 10) {
                    awardBadge(14);
                }

                totalPoints += (parseInt(reflections_done) * 100);
                //assign points for each badge earned
                if (reflections_done >= 1) {
                    awardBadge(28);
                }
                if (reflections_done >= 3) {
                    awardBadge(29);
                }
                if (reflections_done >= 7) {
                    awardBadge(30);
                }
                if (reflections_done >= 10) {
                    awardBadge(31);
                }
                //post badges and points to mongo
                mongo.updateStudentData(courseID, 'studentScoreAndBadges',
                    {
                    _id: studentID
                    },
                    {
                        totalPoints: totalPoints,
                        badges: badges
                    }, (err, response) => {
                        if (err) throw err;
                        if (response.matchedCount === 0) { //if there is no student in mongo yet
                            mongo.insertStudentData(courseID, 'studentScoreAndBadges', //insert student badges and total points
                                {
                                    _id: studentID,
                                    totalPoints: totalPoints,
                                    badges: badges
                                }, (insertErr, insertRes) => {
                                if (insertErr) throw err;
                            });
                        };
                    });
                callback(null, totalPoints, badges);
            }

        });
    });
}

function updateCanvas(studentID, courseID, totalPoints, badges, callback) { // Update Canvas custom points column
    callback(null, totalPoints, badges);
    //get_update_url(courseID, function (update_url) {
    //update_url = update_url + '/' + studentID;
    //putAdminRequest(update_url, {
    //column_data: {
    //content: totalPoints.toString()
    // }
    //  }, function (err, body) {
    //callback(null, totalPoints, badges);
    // });
    //});
}

function getIndScoreAndBadges(studentID, courseID, callback) { // Get score and badge info for user
    computeScoreAndBadges(studentID, courseID, function (err, totalPoints, badges) { //compute scores
        updateCanvas(studentID, courseID, totalPoints, badges, callback); //update Canvas
    });
    console.log("getIndScoreAndBadges() complete")
}

function getStudentProgress(studentID, courseID, callback) { // Get student progress for quizzes and tests (checkboxes)
    mongo.getAllData(courseID, function (mongo_data) {
        let moduleProgress = mongo_data.modules;
        var postTest = { open: (mongo_data.home.find(document => document.type == 'updates').post_test == 'true'), locked: false }; // If the instructors have opened the post test, start it out as true.
        // callback(null, moduleProgress, postTest);
        // return;
        getRequest(assignment_user_url(studentID, courseID), studentID, function (err, user_assignments) {
            moduleProgress = mongo_data.modules;
            if (err) {
                //rather than relying on Canvas, get data from Mongo
                mongo.getStudentData(courseID, 'studentProgress', (mongoErr, data) => {
                    if (mongoErr) {
                        callback(err, moduleProgress, postTest);
                    }
                    else {
                        let studentProgress = data.find(student => student._id == studentID);
                        callback(null, studentProgress.moduleProgress, studentProgress.postTest)
                    }
                    return;
                });
            } else if (user_assignments.status == "unauthorized") {
                console.log('User unauthorized');
                callback(null, moduleProgress, false);
            } else if (user_assignments.error > 0) {
                console.log(data.error);
                callback(null, 0, moduleProgress, false);
            } else if (user_assignments.length < 1) {
                console.log('No User Assignments recorded');
                callback(null, moduleProgress, false);
            } else {
                var postTest = { open: (mongo_data.home.find(document => document.type == 'updates').post_test == 'true'), locked: false }; // If the instructors have opened the post test, start it out as true.
                if (postTest.open) postTest.tooltip = "Click to take the Post Test!";
                else postTest.tooltip = "Your instructors have not yet opened the Post Test!"
                //get quiz and aleks progress
                for (var i = 0; i < moduleProgress.length; i++) {
                    var module_object = mongo_data.modules.find(module => module._id == i + 1);

                    const practiceId_cutoff_obj = (array =>
                        array.reduce((obj, x) => {
                            obj[x.substring(0, x.indexOf('_')).trim()] = parseInt(x.substring(x.indexOf('_') + 1).trim());
                            return obj
                        }, {}))(module_object.multiple_practice_cutoff.trim().split(','));

                    const practice_objects = Object.keys(practiceId_cutoff_obj).map(practice_id => user_assignments.find(assignment => assignment.assignment_id == parseInt(practice_id)));

                    // Modified method for setting practice_progress, avoids errors for undefined practice objects,
                    // which occurred when the student did not have a class with a matching class id. Original code below.
                    (moduleProgress[i]).practice_progress = true;
                    practice_objects.forEach(function (practice_object) {
                        if (practice_object == undefined || practice_object.grade == null || parseFloat(practice_object.grade) < parseFloat(practiceId_cutoff_obj[practice_object.assignment_id + ''])) {
                            (moduleProgress[i]).practice_progress = false;
                            postTest.locked = true;
                        }
                    });

                    // Quiz progress
                    var quiz_object = user_assignments.find(assignment => assignment.assignment_id == module_object.quiz_link);
                    if (quiz_object) {
                        (moduleProgress[i]).quiz_progress = parseFloat(quiz_object.grade) >= parseFloat(module_object.quiz_cutoff);
                    } else {
                        (moduleProgress[i]).quiz_progress = false;
                    }
                    if (!(moduleProgress[i]).quiz_progress) {
                        postTest.locked = true;
                    }
                }
                if (postTest.locked) postTest.tooltip = "Complete all Practices and Applications in order to be eligible for the Post Test!";
                //post student data to mongo
                mongo.updateStudentData(courseID, 'studentProgress',
                    {
                    _id: studentID
                    },
                    {
                        postTest: postTest,
                        moduleProgress: moduleProgress
                    }, (err, response) => {
                        if (err) throw err;
                        if (response.matchedCount === 0) { //if there is no student in mongo yet
                            mongo.insertStudentData(courseID, 'studentProgress', //insert student data
                                {
                                    _id: studentID,
                                    postTest: postTest,
                                    moduleProgress: moduleProgress
                                }, (insertErr, insertRes) => {
                                if (insertErr) throw err;
                            });
                        };
                    });
                callback(null, moduleProgress, postTest);
            }
        });
    });
    console.log("getStudentProgress() complete")
}

function getLeaderboardScores(studentID, courseID, course_title, callback) { // get all leaderboard scores
    function mergeLeaderboardArrays(groupNames, scores) { //merge name and score arrays for leaderboard
        var combinedArray = [];
        for (var i = 0; i < groupNames.length; i++) {
            if (groupNames[i] != course_title) {
                combinedArray.push({
                    'Name': groupNames[i],
                    'Score': scores[i]
                });
            }
        }
        if (combinedArray.length < 3) {
            fillerArray = Array(3 - combinedArray.length).fill({ 'Name': '', 'Score': 0 });
            combinedArray = combinedArray.concat(fillerArray);
        }
        return combinedArray;
    }

    function myTeam(groupNames, scores, index) {
        if (index < 0) {
            return { 'Name': '', 'Score': 0 };
        }
        return { 'Name': groupNames[index], 'Score': scores[index] };
    }

    asyncStuff.waterfall([
        asyncStuff.apply(getSections, course_title),
        getTotalScores,
    ], function (err, scores, groupNames, studentIndex) {
        function compare(a, b) {
            if (a.Score < b.Score) return 1;
            if (a.Score > b.Score) return -1;
            return 0;
        }

        callback(err, mergeLeaderboardArrays(groupNames, scores).sort(compare), myTeam(groupNames, scores, parseInt(studentIndex)));
    });

    function getSections(course_title, callback) {
        function findIndexOfUser(studentIdsArrays) {
            for (var i = 0; i < studentIdsArrays.length; i++) {
                // No need to look through teams which contained no students!
                if (studentIdsArrays.length == 0) continue;

                // See if the student is in this array
                var index = studentIdsArrays[i].indexOf(parseInt(studentID));
                if (index > -1 && groupNames[i] != course_title) return i;
            }
            return -1;
        }

        getAdminRequest(sections_url(courseID), function (err, data) {
            // remove section with all students
            for (var i = 0; i < data.length; i++) {
                if (data[i].students == null) {
                    data.splice(i, 1);
                }
            }
            if (data.length < 1 || config.disableLeaderboard) { //disable leaderboard until sections are made
                callback(null, [], [], 0);
            } else {
                groupNames = data.map(section => section.name);
                studentIdsArrays = data.map((section) => {
                    if (section.students != null) return section.students.map(studentInfo => studentInfo.id);
                    else return [];
                });
                studentIndex = findIndexOfUser(studentIdsArrays, groupNames);
                callback(null, studentIdsArrays, groupNames, studentIndex);
            }
        });
    }


    function getTotalScores(studentIdsArrays, groupNames, studentIndex, callback2) {
        get_update_url(courseID, function (update_url) {
            getAdminRequest(update_url, function (err, pointsInfo) {
                function getPointValue(studentID) {
                    try {
                        return parseInt((pointsInfo.find(studentInfo => studentInfo.user_id == studentID)).content);
                    } catch (e) {
                        return 0;
                    }
                }
                var studentPoints = studentIdsArrays.map(studentIds => ((studentIds.map(studentId => getPointValue(studentId))).reduce((a, b) => a + b, 0)));
                for (var i = 0; i < studentPoints.length; i++) {
                    studentPoints[i] /= studentIdsArrays[i].length;
                    studentPoints[i] = parseInt(studentPoints[i], 10);
                }
                callback2(null, studentPoints, groupNames, studentIndex);
            });
        })
    }
    console.log("getLeaderboardScores() complete")
}

function getAdminLeaderboardScores(courseID, course_title, callback) {
    function mergeLeaderboardArrays(groupNames, scores) { //merge name and score arrays for leaderboard
        var combinedArray = [];
        for (var i = 0; i < groupNames.length; i++) {
            if (groupNames[i] != course_title) {
                combinedArray.push({
                    'Name': groupNames[i],
                    'Score': scores[i]
                });
            }
        }
        if (combinedArray.length < 3) {
            fillerArray = Array(3 - combinedArray.length).fill({ 'Name': '', 'Score': 0 });
            combinedArray = combinedArray.concat(fillerArray);
        }
        return combinedArray;
    }

    asyncStuff.waterfall([
        getSections,
        getTotalScores,
    ], function (err, scores, groupNames) {
        function compare(a, b) {
            if (a.Score < b.Score) return 1;
            if (a.Score > b.Score) return -1;
            return 0;
        }
        callback(err, mergeLeaderboardArrays(groupNames, scores).sort(compare));
    });

    function getSections(callback) {
        getAdminRequest(sections_url(courseID), function (err, data) {

            // remove section with all students
            for (var i = 0; i < data.length; i++) {
                if (data[i].students == null) {
                    data.splice(i, 1);
                }
            }
            if (data.length < 1 || config.disableLeaderboard) { // disable leaderboard until sections are made
                callback(null, [], []);
            } else {
                groupNames = data.map(section => section.name);
                studentIdsArrays = data.map((section) => {
                    if (section.students != null) return section.students.map(studentInfo => studentInfo.id);
                    else return [];
                });
                callback(null, studentIdsArrays, groupNames);
            }
        });
    }

    function getTotalScores(studentIdsArrays, groupNames, callback2) {
        get_update_url(courseID, function (update_url) {
            getAdminRequest(update_url, function (err, pointsInfo) {
                function getPointValue(studentID) {
                    try {
                        return parseInt((pointsInfo.find(studentInfo => studentInfo.user_id == studentID)).content);
                    } catch (e) {
                        return 0;
                    }
                }
                var studentPoints = studentIdsArrays.map(studentIds => ((studentIds.map(studentId => getPointValue(studentId))).reduce((a, b) => a + b, 0)));
                for (var i = 0; i < studentPoints.length; i++) {
                    studentPoints[i] /= studentIdsArrays[i].length;
                    studentPoints[i] = parseInt(studentPoints[i], 10);
                }
                callback2(null, studentPoints, groupNames);
            });
        });
    }
}

function getStudents(courseID, callback) {
    getAdminRequest(student_url(courseID), function (err, student_data) {
        var student_data_sorted = student_data.sort(function (a, b) {
            var textA = a.sortable_name.toUpperCase();
            var textB = b.sortable_name.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        callback(err, student_data_sorted);
    });
}

function getNextDailyYalie(courseID, callback) {
    // url is a string which will contain the URL used to pull the assignments.
    var url = daily_task_url(courseID);

    // Get the list of designated daily task IDs from MongoDB and store it.
    // This code works by making a request to MongoDB for a list of the Daily Task
    // objects created in the Admin Panel. For each task in that list, it appends
    // that task's ID to the list of designated daily task IDs.
    var daily_task_ids = [];
    mongo.getDailyTasks(courseID, function (err, daily_task_objects) {
        daily_task_objects.forEach(function (task) {
            daily_task_ids.push(parseInt(task['assignment_id']));
        });


        getAdminRequest(url, function (err, assignment_list) {
            var closest = Infinity;

            assignment_list.forEach(function (assignment) {
                // Check to see if the assignment is in the list of
                // designated daily task IDs, created in the Admin
                // panel and stored in MongoDB.
                // If in the list, we've found valid assignment. run
                // comparison logic to see if it's the closest one so far.

                if (daily_task_ids.includes(parseInt(assignment.id))) {
                    if (new Date(assignment.due_at) >= new Date() && new Date(assignment.due_at) < closest) closest = assignment;
                }
            });

            // If the closest daily task opens in the future, we shouldn't link to it
            if (new Date(closest.unlock_at) > new Date()) closest.id = -1;

            // Hand the closest daily task off to the callback function.
            callback(null, closest);
        });

    });
    console.log("getNextDailyYalie() complete")
}

function computeScoreAndBadges_masquerade(studentID, courseID, callback) { // Return score and badges
    mongo.getAllData(courseID, function (mongo_data) {
        var badges = mongo_data.badges;
        var totalPoints = 0;
        var practice_proficient = 0;
        var quizzes_attempted = 0;
        var daily_done = 0;
        var reflections_done = 0;

        if (mongo_data.lucky_bulldogs.length > 0) {
            for (lucky_bulldog of mongo_data.lucky_bulldogs) {
                if (lucky_bulldog.awarded_ids.length > 0) {
                    if (lucky_bulldog.awarded_ids.includes(studentID)) {
                        totalPoints += parseInt(lucky_bulldog.point_value);
                    }
                }
            }
        }

        function awardBadge(badgeID) {
            badge_info = mongo_data.badges.find(badge => badge._id == badgeID);
            totalPoints += parseInt(badge_info.Points);
            badges[badges.indexOf(badge_info)].Awarded = true;
        }

        function sortLeaderboardScores(a, b) {
            if (a.score < b.score)
                return 1;
            if (a.score > b.score)
                return -1;
            return 0;
        }

        getAdminRequest(assignment_user_url(studentID, courseID), function (err, data) {
            if (err) {
                console.log(err);
                callback(err, 0, badges);
            } else if (data.status == "unauthorized") {
                console.log('User unauthorized');
                callback('User unauthorized', 0, badges);
            } else if (data.error) {
                console.log(data.error);
                callback(data.error, 0, badges);
            } else if (data.length < 1) {
                console.log('No Assignment Data Recorded');
                callback(null, 0, badges);
            } else {
                //Daily Yalie questions
                for (var i = 0; i < mongo_data.dailies.length; i++) {
                    var daily_object = data.find(daily => daily.assignment_id == (mongo_data.dailies[i]).assignment_id);
                    if (daily_object) {
                        var daily_grade = parseFloat(daily_object.grade);
                        if (daily_grade > parseFloat(0)) {
                            daily_done += 1;
                        }
                    }
                }
                totalPoints += (parseInt(daily_done) * daily_task_point_worth); //assign points for each daily
                //assign points for each badge earned
                if (daily_done >= 1) {
                    awardBadge(1);
                }
                if (daily_done >= 5) {
                    awardBadge(2);
                }
                if (daily_done >= 10) {
                    awardBadge(3);
                }
                if (daily_done >= 15) {
                    awardBadge(4);
                }
                if (daily_done >= 20) {
                    awardBadge(5);
                }
                if (daily_done >= 25) {
                    awardBadge(6);
                }

                // Award Inspirer Badge if there's an entry in the gradebook
                var inspirer = mongo_data.badges.find(badge => badge._id == 32);
                if (inspirer && inspirer.assignment_id) { // Without an ID, just stop
                    var inspirerAsn = data.find(asn => asn.assignment_id == inspirer.assignment_id);
                    if (inspirerAsn) { // Without a valid assignment, just stop
                        inspirerAsn.grade = parseFloat(inspirerAsn.grade);
                        if (!isNaN(inspirerAsn.grade) && inspirerAsn.grade > 0) awardBadge(32); // Verify they have some score
                    }
                }

                for (var i = 0; i < mongo_data.modules.length; i++) {
                    if (mongo_data.modules[i].open == 'true') {

                        //practice objectives proficient
                        var practice_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).practice_link);

                        if (practice_object) {
                            var practice_grade = parseFloat(practice_object.grade);
                            if (practice_grade >= parseFloat(mongo_data.modules[i].practice_cutoff)) {

                                practice_proficient += 1;

                                //Process Practice Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.practice_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.practice_early_bird = studentID.toString();
                                    awardBadge(26);
                                } else {
                                    if (mongo_data.modules[i].leaderboard.practice_early_bird == studentID.toString()) {
                                        awardBadge(26);
                                    }
                                }

                                //Process Practice Leaderboard

                                if (mongo_data.modules[i].leaderboard.practice_leaderboard.find(placement => placement.student_id == studentID)) {
                                    //user is already on leaderboard
                                    awardBadge(20);
                                    user_index = mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID);
                                    mongo_data.modules[i].leaderboard.practice_leaderboard[user_index] = {
                                        'student_id': studentID.toString(),
                                        'score': practice_grade
                                    }
                                    mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                    if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                        //user is top on leaderboard
                                        awardBadge(21);
                                    }

                                } else {
                                    // Process leaderboard if not full - add user automatically
                                    if (mongo_data.modules[i].leaderboard.practice_leaderboard.length < 10) {
                                        mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                                            'student_id': studentID.toString(),
                                            'score': practice_grade
                                        });
                                        awardBadge(20);
                                        mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                        if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                            //user is top on leaderboard
                                            awardBadge(21);
                                        }
                                    } else {
                                        //user not on full leaderboard - compare scores and update
                                        mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                        if (practice_grade > mongo_data.modules[i].leaderboard.practice_leaderboard[mongo_data.modules[i].leaderboard.practice_leaderboard.length - 1].score) {
                                            mongo_data.modules[i].leaderboard.practice_leaderboard.pop()
                                            mongo_data.modules[i].leaderboard.practice_leaderboard.push({
                                                'student_id': studentID.toString(),
                                                'score': practice_grade
                                            });
                                            awardBadge(20);
                                            mongo_data.modules[i].leaderboard.practice_leaderboard = mongo_data.modules[i].leaderboard.practice_leaderboard.sort(sortLeaderboardScores)
                                            if (mongo_data.modules[i].leaderboard.practice_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                                //user is top on leaderboard
                                                awardBadge(21);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //quizzes attempted
                        var quiz_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).quiz_link);
                        if (quiz_object) {
                            var quiz_grade = parseFloat(quiz_object.grade);
                            if (quiz_grade > parseFloat(0)) {
                                quizzes_attempted += 1;

                                //Process Quiz Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.quiz_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.quiz_early_bird = studentID.toString();
                                    awardBadge(24);
                                    mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i],
                                        function (err, result) { });
                                } else {
                                    if (mongo_data.modules[i].leaderboard.quiz_early_bird == studentID.toString()) {
                                        awardBadge(24);
                                    }
                                }

                                //Process Quiz Leaderboard

                                if (mongo_data.modules[i].leaderboard.quiz_leaderboard.find(placement => placement.student_id == studentID)) {
                                    //user is already on leaderboard
                                    awardBadge(22);
                                    user_index = mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID)
                                    mongo_data.modules[i].leaderboard.quiz_leaderboard[user_index] = {
                                        'student_id': studentID.toString(),
                                        'score': quiz_grade
                                    }
                                    mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                    if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                        //user is top on leaderboard
                                        awardBadge(23);
                                    }

                                } else {
                                    // Process leaderboard if not full - add user automatically
                                    if (mongo_data.modules[i].leaderboard.quiz_leaderboard.length < 10) {
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                                            'student_id': studentID.toString(),
                                            'score': quiz_grade
                                        });
                                        awardBadge(22);
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                        if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                            //user is top on leaderboard
                                            awardBadge(23);
                                        }
                                    } else {
                                        //user not on full leaderboard - compare scores and update
                                        mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                        if (quiz_grade > mongo_data.modules[i].leaderboard.quiz_leaderboard[mongo_data.modules[i].leaderboard.quiz_leaderboard.length - 1].score) {
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard.pop()
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard.push({
                                                'student_id': studentID.toString(),
                                                'score': quiz_grade
                                            });
                                            awardBadge(22);
                                            mongo_data.modules[i].leaderboard.quiz_leaderboard = mongo_data.modules[i].leaderboard.quiz_leaderboard.sort(sortLeaderboardScores)
                                            if (mongo_data.modules[i].leaderboard.quiz_leaderboard.findIndex(placement => placement.student_id == studentID) == 0) {
                                                //user is top on leaderboard
                                                awardBadge(23);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //number of reflections
                        var reflection_object = data.find(assignment => assignment.assignment_id == (mongo_data.modules[i]).reflection_link);
                        if (reflection_object) {
                            var reflection_grade = parseFloat(reflection_object.grade);
                            if (reflection_grade == parseFloat(100)) {
                                reflections_done += 1;

                                //Process Reflection Early Bird Badge
                                if (mongo_data.modules[i].leaderboard.reflection_early_bird == "") {
                                    mongo_data.modules[i].leaderboard.reflection_early_bird = studentID.toString();
                                    awardBadge(25);
                                    mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i],
                                        function (err, result) { });
                                } else {
                                    if (mongo_data.modules[i].leaderboard.reflection_early_bird == studentID.toString()) {
                                        awardBadge(25);
                                    }
                                }
                            }
                        }
                        mongo.updateData(courseID, 'modules', { _id: (mongo_data.modules[i])._id }, mongo_data.modules[i], function (err, result) { });
                    }
                }


                totalPoints += (parseInt(practice_proficient) * 100); //assign points for each proficient ALEKS
                //assign points for each badge earned
                if (practice_proficient >= 1) {
                    awardBadge(7);
                }
                if (practice_proficient >= 3) {
                    awardBadge(8);
                }
                if (practice_proficient >= 7) {
                    awardBadge(9);
                }
                if (practice_proficient >= 10) {
                    awardBadge(10);
                }


                totalPoints += (parseInt(quizzes_attempted) * 100); //assign points for each quiz
                //assign points for each badge earned
                if (quizzes_attempted >= 1) {
                    awardBadge(11);
                }
                if (quizzes_attempted >= 3) {
                    awardBadge(12);
                }
                if (quizzes_attempted >= 7) {
                    awardBadge(13);
                }
                if (quizzes_attempted >= 10) {
                    awardBadge(14);
                }

                totalPoints += (parseInt(reflections_done) * 100);
                //assign points for each badge earned
                if (reflections_done >= 1) {
                    awardBadge(28);
                }
                if (reflections_done >= 3) {
                    awardBadge(29);
                }
                if (reflections_done >= 7) {
                    awardBadge(30);
                }
                if (reflections_done >= 10) {
                    awardBadge(31);
                }

                callback(null, totalPoints, badges);
            }

        });
    });
}

function updateCanvas_masquerade(studentID, courseID, totalPoints, badges, callback) { // Update Canvas custom points column
    get_update_url(courseID, function (update_url) {
        update_url = update_url + '/' + studentID;
        putAdminRequest(update_url, {
            column_data: {
                content: totalPoints.toString()
            }
        }, function (err, body) {
            callback(null, totalPoints, badges);
        });
    });
}

function getIndScoreAndBadges_masquerade(studentID, courseID, callback) { // Get score and badge info for user
    computeScoreAndBadges_masquerade(studentID, courseID, function (err, totalPoints, badges) { //compute scores
        updateCanvas_masquerade(studentID, courseID, totalPoints, badges, callback); //update Canvas
    });
}

function getStudentProgress_masquerade(studentID, courseID, callback) { // Get student progress for quizzes and tests (checkboxes)
    mongo.getAllData(courseID, function (mongo_data) {
        getAdminRequest(assignment_user_url(studentID, courseID), function (err, user_assignments) {
            moduleProgress = mongo_data.modules;
            if (err) {
                console.log(err);
                callback(null, moduleProgress, false);
            } else if (user_assignments.status == "unauthorized") {
                console.log('User unauthorized');
                callback(null, moduleProgress, false);
            } else if (user_assignments.error > 0) {
                console.log(data.error);
                callback(null, 0, moduleProgress, false);
            } else if (user_assignments.length < 1) {
                console.log('No User Assignments recorded');
                callback(null, moduleProgress, false);
            } else {
                var postTest = { open: (mongo_data.home.find(document => document.type == 'updates').post_test == 'true'), locked: false }; // If the instructors have opened the post test, start it out as true.
                if (postTest.open) postTest.tooltip = "Click to take the Post Test!";
                else postTest.tooltip = "Your instructors have not yet opened the Post Test!"
                //get quiz and aleks progress
                for (var i = 0; i < moduleProgress.length; i++) {
                    var module_object = mongo_data.modules.find(module => module._id == i + 1);

                    const practiceId_cutoff_obj = (array =>
                        array.reduce((obj, x) => {
                            obj[x.substring(0, x.indexOf('_')).trim()] = parseInt(x.substring(x.indexOf('_') + 1).trim());
                            return obj
                        }, {}))(module_object.multiple_practice_cutoff.trim().split(','));

                    const practice_objects = Object.keys(practiceId_cutoff_obj).map(practice_id => user_assignments.find(assignment => assignment.assignment_id == parseInt(practice_id)));

                    // Modified the code below in accordance with the fix in getStudentProgress()
                    (moduleProgress[i]).practice_progress = true;
                    practice_objects.forEach(function (practice_object) {
                        if (practice_object == undefined || practice_object.grade == null || parseFloat(practice_object.grade) < parseFloat(practiceId_cutoff_obj[practice_object.assignment_id + ''])) {
                            (moduleProgress[i]).practice_progress = false;
                            postTest.locked = true;
                        }
                    });

                    // Quiz progress
                    var quiz_object = user_assignments.find(assignment => assignment.assignment_id == module_object.quiz_link);
                    if (quiz_object) {
                        (moduleProgress[i]).quiz_progress = parseFloat(quiz_object.grade) >= parseFloat(module_object.quiz_cutoff);
                    } else {
                        (moduleProgress[i]).quiz_progress = false;
                    }
                    if (!(moduleProgress[i]).quiz_progress) {
                        postTest.locked = true;
                    }
                }
                if (postTest.locked) postTest.tooltip = "Complete all Practices and Applications in order to be eligible for the Post Test!";
                console.log(postTest);
                callback(null, [moduleProgress, postTest]);
            }
        });
    });
}

function getLeaderboardScores_masquerade(studentID, courseID, course_title, callback) { // get all leaderboard scores

    function mergeLeaderboardArrays(groupNames, scores) { //merge name and score arrays for leaderboard
        var combinedArray = [];
        for (var i = 0; i < groupNames.length; i++) {
            if (groupNames[i] != course_title) {
                combinedArray.push({
                    'Name': groupNames[i],
                    'Score': scores[i]
                });
            }
        }
        if (combinedArray.length < 3) {
            fillerArray = Array(3 - combinedArray.length).fill({ 'Name': '', 'Score': 0 });
            combinedArray = combinedArray.concat(fillerArray);
        }
        return combinedArray;
    }

    function myTeam(groupNames, scores, index) {
        if (index < 0) {
            return { 'Name': '', 'Score': 0 };
        }
        return { 'Name': groupNames[index], 'Score': scores[index] };
    }

    asyncStuff.waterfall([
        asyncStuff.apply(getSections, course_title),
        getTotalScores,
    ], function (err, scores, groupNames, studentIndex) {
        function compare(a, b) {
            if (a.Score < b.Score) return 1;
            if (a.Score > b.Score) return -1;
            return 0;
        }

        callback(err, mergeLeaderboardArrays(groupNames, scores).sort(compare), myTeam(groupNames, scores, parseInt(studentIndex)));
    });

    function getSections(course_title, callback) {
        function findIndexOfUser(studentIdsArrays, groupNames) {
            for (var i = 0; i < studentIdsArrays.length; i++) {
                var index = studentIdsArrays[i].indexOf(parseInt(studentID));
                if (index > -1 && groupNames[i] != course_title) {
                    return i;
                }
            }
            return -1;
        }

        getAdminRequest(sections_url(courseID), function (err, data) {
            // remove section with all students
            for (var i = 0; i < data.length; i++) {
                if (data[i].students == null) {
                    data.splice(i, 1);
                }
            }
            if (data.length < 1 || config.disableLeaderboard) { //disable leaderboard until sections are made
                callback(null, [], [], 0);
            } else {
                groupNames = data.map(section => section.name);
                studentIdsArrays = data.map(section => section.students.map(studentInfo => studentInfo.id));
                studentIndex = findIndexOfUser(studentIdsArrays, groupNames);
                callback(null, studentIdsArrays, groupNames, studentIndex);
            }
        });
    }

    function getTotalScores(studentIdsArrays, groupNames, studentIndex, callback2) {
        get_update_url(courseID, function (update_url) {
            getAdminRequest(update_url, function (err, pointsInfo) {
                function getPointValue(studentID) {
                    try {
                        return parseInt((pointsInfo.find(studentInfo => studentInfo.user_id == studentID)).content);
                    } catch (e) {
                        return 0;
                    }
                }
                var studentPoints = studentIdsArrays.map(studentIds => ((studentIds.map(studentId => getPointValue(studentId))).reduce((a, b) => a + b, 0)));
                for (var i = 0; i < studentPoints.length; i++) {
                    studentPoints[i] /= studentIdsArrays[i].length;
                    studentPoints[i] = parseInt(studentPoints[i], 10);
                }
                callback2(null, studentPoints, groupNames, studentIndex);
            });
        })
    }
}

function getGradebook(courseID, courseName, callback) {
    var gradebook = [];

    function gradebook_done() {
        console.log('Gradebook loading complete.');
        callback(gradebook);
    }

    mongo.getAllData(courseID, (mongo_data) => {
        getAdminRequest(sections_url(courseID), (err, section_data) => {
            // Teams are implmented as sections in Canvas.
            // Each section has a name field , which is considered
            // the name of the team in this system.

            // Calculate expected gradebook size
            var completed_gradebook_size = 0;
            var blacklist = [];
            section_data.forEach((team, ind) => {
                if (team.students == undefined || team.name == courseName || team.name == 'Coaches') blacklist.push(ind);
                else completed_gradebook_size += team.students.length;
            });

            // For each team in the Canvas course, we're going to look at
            // every student on the team.
            section_data.forEach((team, ind) => {
                if (blacklist.includes(ind)) return;
                team.students.forEach((student, index) => {
                    getAdminRequest(assignment_user_url(student.id, courseID), (err, user_assignments) => {
                        // For each student on a given team, we need to go a couple of things.
                        var grades = [];
                        (mongo_data.modules).forEach((module) => {
                            if (module.due == 'true') { // The gradebook is only concerned with modules which are due
                                grades.push({
                                    module_id: module._id,
                                    module_name: (module.primary_title + ' ' + module.secondary_title),
                                    practice_grade: '',
                                    quiz_grade: ''
                                });
                            }
                        });

                        // Now populate those grades
                        user_assignments.forEach((assignment) => {
                            // We are looking for assignments which are in the module list as either a practice or quiz.
                            // These have to be separate because they use different fields :(
                            var thisPracticeModule = (mongo_data.modules).find(module => parseInt(module.practice_link) == parseInt(assignment.assignment_id));
                            var thisQuizModule = (mongo_data.modules).find(module => parseInt(module.quiz_link) == parseInt(assignment.assignment_id));

                            // Round the score off to two decimal places if it exists.
                            var score = assignment.score;
                            if (!isNaN(assignment.score)) score = Math.round(parseFloat(score) * 100) / 100;
                            if (isNaN(score)) score = '';
                            // If the current assignment was flagged as a "practice" module, locate the module in the
                            // grades array and update the proper field (practice grade in this case).
                            if (thisPracticeModule != undefined) {
                                var obj = grades.find(item => parseInt(item.module_id) == parseInt(thisPracticeModule._id));
                                if (obj) obj.practice_grade = score; // If the obj is undefined, the module is not yet open (because it's not in the grades array)
                            }

                            // If the current assignment was flagged as an "apply" module, locate the module in the
                            // grades array and update the proper field (quiz grade in this case).
                            if (thisQuizModule != undefined) {
                                var obj = grades.find(item => parseInt(item.module_id) == parseInt(thisQuizModule._id));
                                if (obj) obj.quiz_grade = score;  // If the obj is undefined, the module is not yet open (because it's not in the grades array)
                            }
                        });

                        // Some student names are still in the format of Last, First even when we pull from student.name,
                        // which, according to Canvas, should be First Last. So let's fix that.
                        var repaired_name = student.name;
                        var dex = repaired_name.indexOf(',');
                        if (dex != -1) repaired_name = repaired_name.substring(dex + 1) + ' ' + repaired_name.substring(0, dex - 1);

                        gradebook.push({
                            student_id: student.id,
                            student_name: repaired_name,
                            team: team.name,
                            grades: grades
                        });

                        if (gradebook.length == completed_gradebook_size) gradebook_done();
                    });
                });
            });
        });
    });
}

var awardLuckies = function (req, res, next) {
    console.log("awardLuckies()")
    var d = new Date();
    var studentID = parseInt(req.session.user_id);
    req.session.lucky = false;

    mongo.getData(req.session.course_id, 'lucky_bulldogs', function (err, luckies) {
        if (luckies.length > 0) {
            for (lucky_bulldog of luckies) {
                // Show difference in times
                // console.log("Time difference: ");
                // console.log(Math.abs((d.getTime() - Date.parse(lucky_bulldog.time))/(1000*60)));

                // If student not already on list AND within a minute of the assigned time...
                if (!lucky_bulldog.awarded_ids.includes(studentID) && Math.abs((d.getTime() - Date.parse(lucky_bulldog.time)) / (1000 * 60)) < 15) {
                    lucky_bulldog.awarded_ids.push(studentID);
                    mongo.updateData(req.session.course_id, 'lucky_bulldogs', { _id: parseInt(lucky_bulldog._id) }, { awarded_ids: lucky_bulldog.awarded_ids }, function (err, result) { });
                    req.session.lucky = lucky_bulldog;
                    console.log("Posted Scores!");
                }
            }
        }
    });
    // Override the value of lucky
    // req.session.lucky = {point_value: 500, image_name: "luckycavman1.png"};
    console.log("awardLuckies() complete")
    next();
}

module.exports = {
    getRequest,
    postRequest,
    putRequest,
    getAdminRequest,
    postAdminRequest,
    putAdminRequest,
    getIndScoreAndBadges,
    getStudentProgress,
    getLeaderboardScores,
    getAdminLeaderboardScores,
    getStudents,
    getNextDailyYalie,
    getIndScoreAndBadges_masquerade,
    getStudentProgress_masquerade,
    getLeaderboardScores_masquerade,
    daily_task_url,
    getGradebook,
    awardLuckies,
}
