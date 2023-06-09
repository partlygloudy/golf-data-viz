
// Packages
const express  = require("express");
const { readFile } = require("fs");


// Create express app
const app = express();


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

    // Load the schedule JSON data from file
    readFile("templates/index.html", "utf-8", (err, html) => {
        response.send(html);
    })

})


// Start the server
app.listen(3000, function () {
    console.log("App available at http://localhost:3000")
})