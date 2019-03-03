# ONEXYS

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

(Deploy button can only be used when Github Repo is public)

Images, Stylesheets, Javascripts, and Static Pages can be accessed through the public folder

## Getting Started

To setup an ONEXYS track in canvas, you will need the following:

* Administrative access to your Canvas Course - you will need to generate and save an administrative token (See instructions [here](https://community.canvaslms.com/docs/DOC-10806-4214724194))

* A **MongoDB database** to store track information - if your school/organization does not have a local setup, then we recommend MongoDB Atlas

* A **Heroku App** (NodeJs) where your track(s) will be deployed. It is free to set up test apps, but we recommend the paid dynos for instances running in production. 

* A **Redis** database. The easiest way to set this up is directly through Heroku through the installed add-ons. We recommend the paid premium version to avoid memory leak issues. 

* A **Canvas Developer Key** from your school when you register this application. This will include a **CANVAS_KEY** *(client ID)* and a *client secret*. [See more details here](https://canvas.instructure.com/doc/api/file.oauth.html). You will have to provide them with a *redirect URL* - if you are deploying this version of the codebase, it will be 
```
https://<YOUR_HEROKU_APP_NAME_HERE>.herokuapp.com/callback
```

