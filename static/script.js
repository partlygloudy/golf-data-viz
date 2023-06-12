

$(document).ready(function() {

    // Get data to build chart
    updateChart(2023, 401465523);

});


function updateChart(year, event) {

    // Request data for the specified tournament
    $.get(`/scorecards/year/${year}/event/${event}`, data => {

        // Build chart from the data
        let newSvg = buildChart(data);

        // Update the chart on the page
        $("#content-wrapper").append(newSvg);

    }, "json");

}


function buildChart(chartData) {

    const playerData = chartData["playerData"];

    // Width and height in pixels of the svg on the screen
    const width = 1000;
    const height = 600;

    // Empty space on each side of chart (inside svg area)
    const paddingTop = 40;
    const paddingRight = 50;
    const paddingBottom = 40;
    const paddingLeft = 50;

    // Domain (min, max values) of the data along each axis
    const domainX = [0, 72];
    const domainY = [chartData["maxScore"] + 2, chartData["minScore"] - 2];
    const ticksX = d3.range(0, 73, 9);

    // Range (min, max chart position in px) for each axis
    const rangeX = [paddingLeft, width-paddingRight];
    const rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
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


    // ----- PLOT SCORING DATA ------ //


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
        .attr("d", player => line(player["holeTotals"]));


    // ----- PLOT CUT LINE ----- //

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
        path.classed("data-path-highlighted", d => d["name"] === name);
        path.filter(d => d["name"] === name).raise();

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
    }

    // ----- RETURN FINISHED CHART ----- //

    // Serialize the svg so it can be rendered into template
    return svg.node();

}
