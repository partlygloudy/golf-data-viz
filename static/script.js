

$(document).ready(function() {

    // Create the chart (leaderboard and svg) and add to the page
    updateChart(2023, 401465523);

    // Populate the dropdown menus for event selection
    populateSelectInputs();

    // Add event listener to 'Go' button
    d3.select("#chart-submit-button").on("click", handleClickGo);

});


function updateChart(year, event) {

    // Request data for the specified tournament
    $.get(`/scorecards/year/${year}/event/${event}`, data => {

        // Build chart from the data
        let newSvg = buildChart(data);

        // Update the chart on the page
        $("#chart-svg-wrapper").append(newSvg);

        // Update the leaderboard table
        updateLeaderboard(data);

    }, "json");

}


function buildChart(chartData) {

    const playerData = chartData["playerData"];

    // Width and height in pixels of the svg on the screen
    const width = 1200;
    const height = 600;

    // Empty space on each side of chart (inside svg area)
    const paddingTop = 20;
    const paddingRight = 10;
    const paddingBottom = 20;
    const paddingLeft = 20;

    // Domain (min, max values) of the data along each axis
    const domainX = [0, 72];
    const domainY = [chartData["maxScore"] + 2, chartData["minScore"] - 2];
    const ticksX = d3.range(0, 73, 9);

    // Range (min, max chart position in px) for each axis
    const rangeX = [paddingLeft, width-paddingRight];
    const rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .classed("svg-chart", true)
        .on("pointerenter", pointerEnter)
        .on("pointermove", pointerMoved)
        .on("pointerleave", pointerLeave);

    // Create linear scales for the x and y axes ('scale functions')
    const xScale = d3.scaleLinear().domain(domainX).range(rangeX);
    const yScale = d3.scaleLinear().domain(domainY).range(rangeY);

    // Use the x, y scales to create bottom, left 'axis functions' respectively
    const xAxis = d3.axisBottom(xScale).tickValues(ticksX);
    const yAxis = d3.axisLeft(yScale);


    // ----- CREATE AXES & REFERENCE LINES ------ //


    // X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - paddingBottom})`)
        .call(xAxis)

    // Y axis & horizontal reference lines
    svg.append("g")
        .attr("transform", `translate(${paddingLeft}, 0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())   // Remove solid Y axis line
        .call(g => {                               // Add horizontal lines at each tick
            g.selectAll(".tick line")
                .clone()
                .attr("x2", width - paddingLeft - paddingRight)
                .classed("tick-y-cross", true)
        });


    // ----- SCORING DATA ------ //


    // Split data into x (holes #s), y (cumulative scores), and z dimensions
    const X = playerData.map(data => data["holeTotals"].map(([hole,]) => hole));
    const Y = playerData.map(data => data["holeTotals"].map(([, score]) => score));
    const Z = playerData.map(data => data["name"]);

    // Create an index for looking up data for a specific index
    const I = d3.range(X.length);

    // Create line generator for plotting score data
    const line = d3.line()
        .curve(d3.curveBumpX)
        .x(score => xScale(score[0]))    // Hole
        .y(score => yScale(score[1]));   // Player's score after that hole

    // Create line for each player's running score
    const path = svg.append("g")
        .selectAll("path")
        .data(playerData)
        .join("path")
        .classed("data-path", true)
        .attr("id", d => "data-path-" + d["id"])
        .attr("d", d => line(d["holeTotals"]));


    // ----- CUT LINE ----- //

    const cutY = yScale(chartData["cutLine"]);

    // Vertical line at 36 hole mark
    svg.append("g")
        .append("line")
        .attr("x1", xScale(36))
        .attr("y1", rangeY[0])
        .attr("x2", xScale(36))
        .attr("y2", cutY)
        .classed("cut-line-vert", true);

    // Horizontal line at the cut line score
    svg.append("g")
        .append("line")
        .attr("x1", rangeX[0])
        .attr("y1", yScale(chartData["cutLine"]))
        .attr("x2", xScale(36))
        .attr("y2", yScale(chartData["cutLine"]))
        .classed("cut-line-horiz", true);


    // ----- SELECTED HOLE VERTICAL LINE ----- //

    const selectedHoleLine = svg.append("g")
        .append("line")
        .attr("x1", xScale(36))
        .attr("y1", rangeY[0])
        .attr("x2", xScale(36))
        .attr("y2", rangeY[1])
        .classed("selected-hole-vert", true)
        .attr("visibility", "hidden");


    // ----- EVENT HANDLING ------ //


    // Event handler to highlight the closest path when the cursor moves
    function pointerMoved(event) {

        // Get x, y positions of the pointer
        const [x, y] = d3.pointer(event);

        // Get the index of the path containing the closest point to the cursor
        const closestPathIdx = d3.least(I, i => {

            // Get the closest point for each given player
            const playerIdx = d3.least(d3.range(X[i].length), j => {
                return Math.hypot(xScale(X[i][j]) - x, yScale(Y[i][j]) - y);
            })

            return Math.hypot(xScale(X[i][playerIdx]) - x, yScale(Y[i][playerIdx]) - y)

        })

        // Get name associated with closest path
        const name = Z[closestPathIdx];

        // Apply "highlighted" class to the closest path, remove from the rest
        path.classed("data-path-hovered", d => d["name"] === name);
        path.filter(d => d["name"] === name).raise();

        // Move any selected player paths back to the top
        d3.selectAll(".data-path-selected").raise();

        // Move current hole marker to the nearest hole
        let nearestX = d3.least(d3.range(72), h => Math.abs(xScale(h) - x));
        nearestX = xScale(nearestX);
        selectedHoleLine.attr("x1", nearestX).attr("x2", nearestX);

    }

    function pointerEnter(event) {
        selectedHoleLine.attr("visibility", "visible");
    }

    function pointerLeave(event) {
        selectedHoleLine.attr("visibility", "hidden");
        d3.selectAll(".data-path-hovered").classed("data-path-hovered", false);
    }

    // ----- RETURN FINISHED CHART ----- //

    // Serialize the svg so it can be rendered into template
    return svg.node();

}


function updateLeaderboard(chartData) {

    // Select the leaderboard table (body)
    d3.select("#leaderboard-table-body")

        // Create a row for each player
        .selectAll("tr")
        .data(chartData["playerData"])
        .join("tr")

        // Add class to alternating rows for highlighting
        .classed("leaderboard-alt-row", (d, i) => i % 2 === 1)

        // Add class indicating if player was cut
        .classed("leaderboard-cut-row", d => d["cut"])

        // Add click handler to toggle selected player highlighting
        .on("click", (e, d) => {

            // Toggle line highlighting in the svg
            let line = d3.select("#data-path-" + d["id"]);
            line.classed("data-path-selected", !line.classed("data-path-selected")).raise();

            // Toggle row highlighting in the table
            let row = d3.select(e.currentTarget);
            row.classed("leaderboard-selected-row", !row.classed("leaderboard-selected-row"));

        })

        // Add hover handler to toggle hovered player highlighting
        .on("mouseover", (e, d) => {
            d3.select("#data-path-" + d["id"])
                .classed("data-path-hovered", true)
                .raise();
        })
        .on("mouseleave", (e, d) => {
            let path = d3.select("#data-path-" + d["id"])
                .classed("data-path-hovered", false);
            if (!path.classed("data-path-selected")) {
                path.lower();
            }
        })

        // Add column data to each row
        .selectAll("td")
        .data(d => {
            return [
                d["cut"] ? "CUT" : d["rank"],
                d["name"],
                d["eventScoreToPar"],
                d["roundTotals"][0],
                d["roundTotals"][1],
                d["cut"] ? "-" : d["roundTotals"][2],
                d["cut"] ? "-" : d["roundTotals"][3],
                d["eventTotal"]
            ];
        })
        .join("td")

        // Set the text of the data cell - for over par scores, print '+' before number
        .text((d, i) => {
            if (i === 2 && d > 0) {
                return "+" + d;
            }
            return d
        })

        // For under par scores, add 'td=under' par class so red highlighting is applied
        .classed("td-under-par", (d, i) => {
            return i === 2 && d < 0;
        });

}


function populateSelectInputs() {

    // Request data for the specified tournament
    $.get("/events/manifest", data => {

        let yearSelect = d3.select("#select-event-year");

        yearSelect.selectAll("option")
            .data(Object.entries(data))
            .join("option")
            .text(d => d[0])
            .attr("value", d => d[0]);

        yearSelect.on("change", (e) => {

            // Check which year is currently selected
            let selectedYear = yearSelect.node().value;
            let eventData = data[selectedYear];

            // Remove the current options from the event select menu
            let eventSelect = d3.select("#select-event-name");
            eventSelect.selectAll("option").remove();

            // Populate the menu with the events for the selected year
            eventSelect.selectAll("option")
                .data(eventData)
                .join("option")
                .text(d => d["name"]);

        });

    }, "json");

}


function handleClickGo(e) {

    // Get the currently selected options
    let year = d3.select('#select-event-year').select('option:checked').datum()[0];
    let event = d3.select('#select-event-name').select('option:checked').datum()["id"];

    // Update the chart
    updateChart(year, event);

}
