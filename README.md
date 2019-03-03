# ONEXYS

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

(Deploy button can only be used when Github Repo is public)

Images, Stylesheets, Javascripts, and Static Pages can be accessed through the public folder

## Requirements

To setup an ONEXYS track in canvas, you will need the following:

* Administrative access to your Canvas Course - you will need to generate and save an administrative token (See instructions [here](https://community.canvaslms.com/docs/DOC-10806-4214724194))

* A **MongoDB database** to store track information - if your school/organization does not have a local setup, then we recommend MongoDB Atlas

* A **Heroku** account which will own and maintain the running application 

* A **Redis** database. The easiest way to set this up is directly through Heroku through the installed add-ons. We recommend the paid premium version to avoid memory leak issues. 

* A **Canvas Developer Key** from your school when you register this application. This will include the **CANVAS_KEY** *(client ID)* and the **DEVELOPER_TOKEN** *client secret*. [See more details here](https://canvas.instructure.com/doc/api/file.oauth.html). You will have to provide them with a *redirect URL* - if you are deploying this version of the codebase, it will be 
```
https://<YOUR_HEROKU_APP_NAME_HERE>.herokuapp.com/callback
```

## Getting Started

1. Fork this repository

2. Click the `Deploy to Heroku` button above

3. Fill out all of the pertinent information above in the fields. Note that these will be treated as environment variables in the application, and can be access via the Heroku *Config Vars*

4. Upload data to MongoDB

5. Create your Canvas Apps. Currently, this code supports different apps for `/home`, `/badges`, and `/admin` (only admins will be able to access, but make sure only admins can see to not confuse students). 
    * To make an app, visit https://www.edu-apps.org/build_xml.html. Use whatever name, id, and description you would like. For the launch URL, use the heroku url. For example, for home, it would be `https://<YOUR_HEROKU_APP_NAME_HERE>.herokuapp.com/home`. Make sure to set Launch Privacy to public, the domain to the heroku app `https://<YOUR_HEROKU_APP_NAME_HERE>.herokuapp.com`, and for extensions, check the *Course Navigation* option, copy the launch URL, and set the text for what students will see on the left side of Canvas (keep it short, like *Home*). 
    * You will have to repeat this step for each app - home, badges, and admin (for this, set visibility to *admins only*)

6. Create new custom apps in the Canvas App Center. You will need the canvas key (consumer key) and shared secret (developer key) to build each app, and you will be able to copy-paste in the XML configuration for each app.

7. Add your Canvas Course Number and Mongo URL to `bin\config.js`, in the config.MongoURLs object (the key will be the course number as a string, the object is the mongo auth url, including the username and password). 

## File Guide

* The main app file is `app.js`. However, the actual file that configures and starts the webapp is `start.js`

* All configuration variables (including environmental variables) are set in `bin/config.js`

* Main wrapper queries for homepage and badges are in `models/queries.js`. Mongo queries are in `models/mongo.js`

* All Canvas related functionality is in `models/canvas.js`. This code contains business logic that is very specific to both canvas, and the ONEXYS programs run at Yale (including measurement of student progress and badge calculation). This is, in essence, the heart of the codebase. 

* Oath2 authentication happens in `bin/auth.js`. This is fairly complex and easy to break, so proceed with caution for changes.

* The main logic for each route is in the `routes/` directory (these are the controllers in the MVC framework). The HTML views are written in [pug](https://pugjs.org/api/getting-started.html), and are in `views/`


## Branding

Most of the branded content takes place in the form of images and content in the `\public` directory. Changing this requires uploading new content to the repository, as well as updating the corresponding filenames in either the stylesheets or in the views themselves. 

## Disclaimer

The phrase "code is it's own documentation" holds painfully true in this codebase (thus far). Many pieces of code were written for a specific purpose/use during the previous program. Many pieces were for testing random things that were broken. And many pieces just should not have been written in the first place. My advice is this:    
* parse through the codebase and try to get a high-level understanding of how everything works

* spend the time to get your local development working for testing. it saves so much time in the end. this includes a working local Mongo database. skip the authentication stuff though - not worth the hassle

* iterate and improve slowly