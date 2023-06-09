
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require("fs");

// Params
let year = 2023;

// URL for ESPN leaderboard page
const url = `https://www.espn.com/golf/schedule/_/season/${year}`;

// Object to store result
let events = {};

// Use axios to request page
axios.get(url).then(response => {

    // Load the HTML response to $
    const $ = cheerio.load(response.data);

    // Use JQuery to get all the event names
    $(".eventAndLocation__tournamentLink").each(function() {

        // Get the tournament name as a string
        let tournament = $(this).text();

        // Get tournament id from the link in the parent 
        let href = $(this).parent().attr("href");

        if (typeof(href) !== "undefined") {
            let idx = href.indexOf("tournamentId=");
            let tournamentId = href.substring(idx + 13);
            events[tournamentId] = tournament;
        } else {
            console.log(`No Tournament ID for ${tournament}`);
        }

    });

    // Convert JSON object to string
    const outString = JSON.stringify(events, null, 2); // 2 spaces for pretty formatting

    // Write to a file
    fs.writeFile(`../data/espn_tournament_ids_${year}.json`, outString, err => {});

});

