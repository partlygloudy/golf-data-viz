
const axios = require("axios");
const fs = require("fs");

// URL for schedule data
const url = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/tourschedule?season=";

// Params
let startYear = 2001;
let stopYear = 2023;
let pauseMs = 1000;
let counter = 0;

// Get schedule data for each year in the range
for (let y=startYear; y<=stopYear; y++) {

    // Run after set time (so we don't spam the API)
    setTimeout(function() {

        // Get the schedule for the year
        axios.get(url + y).then(response => {

            // Read the response JSON, clean up the data
            let dataString = "";
            response.data["seasons"].forEach((yearData) => {
                if (yearData["year"] === y) {
                    dataString = JSON.stringify(yearData, null, 2);
                }
            })

            // Convert to a string and save to file
            fs.writeFile(`../data/schedules/${y}.json`, dataString, () => {});

        })
    }, counter * pauseMs);

    // Increment counter
    counter++;

}
