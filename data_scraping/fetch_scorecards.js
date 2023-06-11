
const axios = require("axios");
const fs = require("fs");

// URL for field data
const url = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard/";

// Params
let pauseMs = 500;

// Timer
const timer = ms => new Promise(res => setTimeout(res, ms));


async function getEventScorecards(year, eventId) {

    // Build url for the event (still need to append player ID at the end
    let eventUrl = url + eventId + "/competitorsummary/";

    // Get the list of player IDs for the event
    const fieldsRaw = fs.readFileSync(`../data/fields/${year}.json`, 'utf8');
    const fields = JSON.parse(fieldsRaw);

    // Object to store result
    let result = {};

    // Iterate over the players in the event
    for (const playerId of fields[eventId]) {

        // Object to store player data
        let playerData = {
            "roundData": {}
        };

        // Get the event details
        await axios.get(eventUrl + playerId).then(response => {

            // Add player string name to player data
            playerData["name"] = response.data["competitor"]["displayName"];

            for (const round of response.data["rounds"]) {

                // Vars to store round data
                let roundIdx = round["period"];

                if (roundIdx <= 4) {

                    let strokes = [];
                    let scoresToPar = [];

                    // Get data for each hole
                    for (const holeData of round["linescores"]) {
                        strokes.push(holeData["value"]);
                        scoresToPar.push(holeData["value"] - holeData["par"]);
                    }

                    // Compile round data and add it to player data
                    playerData["roundData"][roundIdx] = {
                        "strokes": strokes,
                        "scoresToPar": scoresToPar
                    }

                }

            }

        }).catch((error) => {
            console.log(`Error fetching data for player ID = ${playerId}\tResponse Code: ${error.status}`);
        });

        // Add player data to overall result object
        result[playerId] = playerData;

        // Pause between requests to not spam server
        await timer(pauseMs);

    }

    // Stringify the JSON and write to file
    let resultString = JSON.stringify(result, null, 2);

    // Format so all list items are on one line
    resultString = resultString.replace(/(\d+,)\n +/g, '$1 ');
    resultString = resultString.replace(/\[\n +/g, '[');
    resultString = resultString.replace(/\n +]/g, ']');

    // Convert to a string and save to file
    fs.writeFile(`../data/scorecards/${year}/${eventId}.json`, resultString, () => {});

}


async function getEventScorecardsForYear(year) {

    // Get list of events for the year
    const scheduleRaw = fs.readFileSync(`../data/fields/${year}.json`, 'utf8');
    const schedule = JSON.parse(scheduleRaw);

    // Get scorecard data for each event
    for (const eventId of Object.keys(schedule)) {
        console.log(`Getting scorecard data for event ${eventId}`);
        await getEventScorecards(year, eventId);
    }

}


// Run the data collection function
getEventScorecardsForYear(2023);