
$(document).ready(function() {

    // populateScheduleUpcoming();
    $("body").append(multiLineChart());


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


function multiLineChart() {

    // Width and height in pixels of the svg on the screen
    let width = 800;
    let height = 500;

    // Empty space on each side of chart (inside svg area)
    let paddingTop = 40;
    let paddingRight = 50;
    let paddingBottom = 40;
    let paddingLeft = 50;

    // Domain (min, max values) of the data along each axis
    let domainX = [0, 72];
    let domainY = [-20, 20];
    let ticksX = d3.range(0, 73, 9);

    // Range (min, max chart position in px) for each axis
    let rangeX = [paddingLeft, width-paddingRight];
    let rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .classed("svg-chart", true)

    // Create linear scales for the x and y axes ('scale functions')
    let xScale = d3.scaleLinear().domain(domainX).range(rangeX);
    let yScale = d3.scaleLinear().domain(domainY).range(rangeY);

    // Use the x, y scales to create bottom, left 'axis functions' respectively
    let xAxis = d3.axisBottom(xScale).tickValues(ticksX);
    let yAxis = d3.axisLeft(yScale);

    // Add the axes to the SVG
    let xAxisRef = svg.append("g")
        .attr("transform", `translate(0, ${height - paddingBottom})`)
        .call(xAxis)
    let yAxisRef = svg.append("g")
        .attr("transform", `translate(${paddingLeft}, 0)`)
        .call(yAxis)

    // Remove y axis (except ticks, labels)
    yAxisRef.call(g => {
        g.select(".domain").remove()
    })

    // Add horizontal lines at each tick
    yAxisRef.call(g => {
        g.selectAll(".tick line")
            .clone()
            .attr("x2", width - paddingLeft - paddingRight)
            .classed("tick-y-cross", true)
    })

    return svg.node();

}