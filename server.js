
// Module imports
import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { loadScorecardData } from "./data_utils.js";
import fs from "fs";

// define __filename and __dirname for use by template renderer
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Create and configure express app
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));


/**
 * Add logging for all incoming requests
 */
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});


/**
 * Request handler for all static file requests
 */
app.use('/static', express.static("static"));


/**
 * Request handler for the main webpage. Responds to GET
 * requests to the / endpoint. Serves index.html
 */
app.get("/", function (request, response) {

    // Render svg chart into template and return
    response.render("index");

})


/**
 * Request handler to get scorecard data for a tournament & year. Returns
 * condensed scorecard data for each player in a JSON object
 */
app.get("/scorecards/year/:year/event/:event", function (request, response) {

    // Load the data for the requested event and return as JSON
    let data = loadScorecardData(request.params.year, request.params.event);
    response.json(data);

})


/**
 * Request handler to get event ids and names for each year that scorecard
 * data is available
 */
app.get("/events/manifest", function (request, response) {

    // Load event manifest and return
    const scorecardsRaw = fs.readFileSync("data/event_manifest.json", 'utf8');
    response.json(JSON.parse(scorecardsRaw));

})


// Start the server
app.listen(3000, function () {
    console.log("App available at http://localhost:3000")
})