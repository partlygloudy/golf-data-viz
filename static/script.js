
$(document).ready(function() {

    // populateScheduleUpcoming();

});

function populateScheduleUpcoming() {

    // Headers for labelling the columns
    let tableHeaders = ["Event", "Course", "Location", "Start Date"];

    // Create row of headers from the labels
    d3.select("#schedule-table-upcoming")
        .append("thead")
        .append("tr")         // Add header row
        .selectAll("td")      // select tds to bind data
        .data(tableHeaders)   // bind the labels
        .enter()              // get all the missing elements
        .append("td")         // create them
        .text(h => h);        // apply the label

    // Get schedule JSON from the server
    $.get("/static/data/schedule.json", scheduleData => {

        // Create a row for each event
        let rows = d3.select("#schedule-table-upcoming")
            .append("tbody")
            .selectAll("tr")
            .data(scheduleData["schedule"])    // bind list of schedule events
            .enter()
            .append("tr")

        // Add columns with event data to each row
        let cells = rows.selectAll("td")
            .data(e => {
                return [e.event_name, e.course, e.location, e.start_date]
            })
            .enter()
            .append("td")
            .text(cellVal => cellVal)

    })

}
