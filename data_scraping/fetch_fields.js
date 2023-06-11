
const axios = require("axios");
const fs = require("fs");

// URL for field data
const url = "https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=";

// Params
let startYear = 2001;
let stopYear = 2023;
let pauseMs = 1000;


// Timer
const timer = ms => new Promise(res => setTimeout(res, ms));


// Async function to perform work (so we can use await)
async function getEventFields() {

    // Get schedule data for each year in the range
    for (let y=startYear; y<=stopYear; y++) {

        // Read the schedule JSON file for this year
        const scheduleRaw = fs.readFileSync(`../data/schedules/${y}.json`, 'utf8');
        const schedule = JSON.parse(scheduleRaw);

        // Object to store the result in
        let result = {}

        // Iterate over the event list
        for (const eventData of schedule['events']) {

            // Get the event id
            let eventId = eventData["id"];

            // Log year, event to track progress
            console.log(`Year: ${y}\tEvent: ${eventId}\tName: ${eventData["label"]}`);

            // Get the event details
            await axios.get(url + eventId).then(response => {

                try {

                    // Get the competitor list
                    let competitors = response.data["events"][0]["competitions"][0]["competitors"];

                    // Ignore fields without competitor data (Ryder Cup, The Match, etc.)
                    if (typeof(competitors) !== "undefined") {

                        // Build list of competitor IDs
                        let competitorIds = [];
                        competitors.forEach((competitorData) => {
                            competitorIds.push(competitorData["id"]);
                        })

                        // Add to the main result object
                        result[eventId] = competitorIds;

                    } else {
                        console.log(`No field data for this event`)
                    }

                } catch (err) {
                    console.log("Error parsing event data (probably an alternate tournament format)")
                }

            }).catch((error) => {
                console.log(`An HTTP error occurred for this URL (status code ${error.status})`);
            });

            // Wait 1 second
            await timer(pauseMs);

        }

        // Stringify the JSON and write to file
        let resultString = JSON.stringify(result, null, 2);

        // Format so all list items are on one line
        resultString = resultString.replace(/("\d+",)\n +/g, '$1 ');
        resultString = resultString.replace(/\[\n +/g, '[');
        resultString = resultString.replace(/\n +]/g, ']');

        // Convert to a string and save to file
        fs.writeFile(`../data/fields/${y}.json`, resultString, () => {});

    }

}


// Run the data collection function
getEventFields();




