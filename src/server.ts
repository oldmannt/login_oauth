import http from "http";
import session from "express-session";
import express from "express";
import { google, plus_v1 } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

const plus = google.plus("v1");

// Load environment variables from .env file, where API keys and passwords are configured
if (!fs.existsSync(".env")) {
    console.error("Using .env file to supply config environment variables.");
}
else {
    dotenv.config({ path: ".env" });
    console.info("load .env");
}


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECTION_URL = process.env.REDIRECTION_URL;

function getOAuthClient() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECTION_URL);
}

function getAuthUrl(): string {
    const oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calen
    const socpes = [
        "https://www.googleapis.com/auth/plus.me"
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: socpes // If you only need one scope you can pass it
    });

    return url;
}

const app = express();

app.use(session({
    secret: "your-random-secret-19890913007",
    resave: true,
    saveUninitialized: true
}));

// is this google callback
app.get("/oauth_callback", function(req, res) {
    const oauth2Client = getOAuthClient();
    const session = req.session;
    const code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {
        // Now tokens contains an access_token and an optional refresh

        if (!err) {
            // saving the token to current session
            if (session)
                session["tokens"] = tokens;
            res.set("Content-Type", "text/html");
            res.send(`
                <h3>Login successful!!</h3> <a href="/details">Go to details page</a>
            `);
        }
        else {
            res.send(`
                <h3>Login failed!!<h3>;
            `);
        }
    });
});

// this is the base route
app.get("/", function(req, res) {
    const url = getAuthUrl();
    res.set("Content-Type", "text/html");
    res.send(`
    <h1>Authentication using google oAuth</h1> <a href=${url}>Login</a>
    `);
});

app.get("/details", function(req, res) {
    console.log(`/details ${req.session}`);
    if (!req.session) {
        res.status(403);
        return;
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session["tokens"]);
    plus.people.get({userId: "me", auth: oauth2Client }, function(err, response) {
        console.log(`plus.people.get err: ${err} response: ${response}`);
        if (response) {
            res.send(`
            <img src=${response.data.image.url} />
            <h3> Hello ${response.data.displayName} </h3>
        `);
        }
    });
});

app.use(function(req, res, next) {
    res.set("Content-Type", "text/plain");
    res.status(404);
    res.send("404");
});

const port = 9527;
const server = http.createServer(app);
server.listen(port);
server.on("listening", function() {
    console.log("listening to ${port}");
});