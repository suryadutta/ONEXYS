let express = require('express');
let config = require('./config');
let request = require('request');
let Queue = require('better-queue');

let lti = require ('ims-lti');
let RedisNonceStore = require('../node_modules/ims-lti/lib/redis-nonce-store.js');
let redis = require("redis"),
    redis_client = redis.createClient(config.redisURL);

let store = new RedisNonceStore(config.client_id, redis_client);
if (!provider) {
  let provider = new lti.Provider(config.client_id, config.client_secret);
}

// Set the configuration settings
let credentials = {
  client: {
    id: config.client_id,
    secret: config.client_secret,
  },
  auth: {
    tokenHost: config.canvasURL,
    tokenPath: 'login/oauth2/token',
    authorizePath: 'login/oauth2/auth',
  },
};

let oauth2 = require('simple-oauth2').create(credentials);

//queue to callback Auth Token (prevents multiple calls)
let authTokenQueue = new Queue(function(arg,callback){
  redis_client.get('token_'+provider.body.custom_canvas_user_id, async function(err, token_string) {
    if (err){
      console.log(err);
      callback(false);
    } else {
      token_obj = JSON.parse(token_string);
      let accessToken = await oauth2.accessToken.create(token_obj.token);
      // Check if the token is expired. If expired it is refreshed.
      if (accessToken.expired()) {
        try {
          // save refresh token to add later
          let refresh_token = accessToken.token.refresh_token;
          // get new access token from Canvas API
          accessToken = await accessToken.refresh(credentials.client);
          // add back the previous refresh token to use again
          accessToken.token.refresh_token = refresh_token;
          // save new access token to Redis store
          redis_client.set('token_'+provider.body.custom_canvas_user_id, JSON.stringify(accessToken));
          callback(accessToken.token.access_token)
        } catch (error) {
          console.log('Error refreshing access token: ', error.message);
          callback(false);
        }
      } else {
        callback(accessToken.token.access_token);
      }
    }
  });
});

//middleware to check if admin
let checkAdmin = function(req,res,next) {
  if (!provider.admin){
    res.redirect('/home')
  }else {
    next()
  }
}

//middleware to check user and launch lti
let checkUser = function(req, res, next) { 
  req.connection.encrypted = true;
  if (req.query.login_success=='1'){
    next()
  } else {
     //launch LTI instance
    provider.valid_request(req, function(err, is_valid) {
      if (!is_valid) {
        console.log('Unverified User:');
        console.log(provider.valid_request);
        console.log(provider);
        res.send('Unverified User');
      } else {         
        //check if auth token already exists in Redis 
        redis_client.exists('token_'+provider.body.custom_canvas_user_id, function(err, token_exists) {
          if (token_exists==0){
            // generate auth token
            let authorizationUri = oauth2.authorizationCode.authorizeURL({
              redirect_uri: config.redirectURL,
              state: provider.body.custom_canvas_user_id,
            });
            res.redirect(authorizationUri);
          } else {
            // auth token exists
            next();
          }
        });
      }
    });
  }
}

//path for oauth2 callback from Canvas server
let oath2_callback = async function(req, res, next){
  let code = req.query.code;
  let options = {
    code,
  };
  try {
    // create new access token from Canvas API
    let result = await oauth2.authorizationCode.getToken(options);
    let accessToken = await oauth2.accessToken.create(result);
    // save access token to Redis
    redis_client.set('token_'+provider.body.custom_canvas_user_id, JSON.stringify(accessToken));
    return res.redirect('/home?login_success=1')
  } catch(error) {
    console.error('Access Token Error', error.message);
    return res.status(500).json('Authentication failed');
  }
}

module.exports = {
    oath2_callback,
    provider,
    authTokenQueue,
    checkUser,
    checkAdmin
};
