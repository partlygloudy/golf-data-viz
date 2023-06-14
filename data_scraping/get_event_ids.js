
import fs from "fs";

// Params
const start = 2001;
const stop = 2023

// Object to store result
let result = {};

// Get events for each year in the range
for (let y=start; y<= stop; y++) {

    let yearEvents = []

    // Load the schedule for the current year
    const scheduleRaw = fs.readFileSync(`../data/schedules/${y}.json`, 'utf8');
    const schedule = JSON.parse(scheduleRaw);

    // Iterate over the events for the year, add id and name to list of events
    if ("events" in schedule) {
        for (const eventData of schedule["events"]) {
            yearEvents.push({
                "id": eventData["id"],
                "name": eventData["label"]
            });
        }
    }

    // Add this year to the main result object
    result[y] = yearEvents;

}


// Save the result to a file
let resultString = JSON.stringify(result, null, 2);
fs.writeFile("../data/event_manifest.json", resultString, () => {});




