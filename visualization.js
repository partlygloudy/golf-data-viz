
// Module imports
import {JSDOM} from "jsdom";
import * as d3 from "d3";
import fs from "fs";


// Basic html doc string for JSDOM
const html = "<!DOCTYPE html><body></body>"


function loadScorecardData(year, eventId) {

    // Load full scorecard data for the event
    const path = `data/scorecards/${year}/${eventId}.json`;
    const scorecardsRaw = fs.readFileSync(path, 'utf8');
    const scorecards = JSON.parse(scorecardsRaw);

    // Get keys as an array
    let allPlayersData = Object.values(scorecards);

    // Format the data in the way the graphing function expects
    let formattedData = [];
    for (let i=0; i<allPlayersData.length; i++) {

        // Get data for this player
        let playerData = allPlayersData[i];

        // Concatenate round scores into a single array
        let holeScores = [];
        ["1", "2", "3", "4"].forEach((item) => {
            if (item in playerData["roundData"]) {
                holeScores = holeScores.concat(playerData["roundData"][item]["scoresToPar"]);
            }
        })

        // Compute cumulative scores for each hole
        let holeTotals = [[0, 0]];
        let runningScore = [0];
        let totalScore = 0;
        for (let i=1; i<=holeScores.length; i++) {
            totalScore += holeScores[i-1];
            holeTotals.push([i, totalScore]);
            runningScore.push(totalScore);
        }

        // Build object with formatted player data
        let formattedPlayerData = {
            "name": playerData["name"],
            "holeScores": holeScores,
            "holeTotals": holeTotals,
            "runningScore": runningScore
        }

        // Add to the full list
        formattedData.push(formattedPlayerData);

    }

    return formattedData

}


function getMinMaxScores(playerScoringData) {

    // Initialize at zero
    let minScore = 0;
    let maxScore = 0;

    // Go through each player's scoring data
    playerScoringData.forEach((item) => {
        // Get player min and max score
        let playerMin = Math.min(...item["runningScore"]);
        let playerMax = Math.max(...item["runningScore"]);

        // Update field min and max
        minScore = Math.min(minScore, playerMin);
        maxScore = Math.max(maxScore, playerMax);

    })

    // Return min, max (reverse order so low scores go up on graph)
    return [maxScore + 2, minScore - 2];

}

export function multiLineChart(year, eventId) {

    // Setup DOM so d3 has somewhere to work
    const jsdom = new JSDOM(html);

    // Get player scorecard data for the event
    let playerData = loadScorecardData(year, eventId);

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
    let domainY = getMinMaxScores(playerData);
    let ticksX = d3.range(0, 73, 9);

    // Range (min, max chart position in px) for each axis
    let rangeX = [paddingLeft, width-paddingRight];
    let rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.select(jsdom.window.document.body).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .classed("svg-chart", true);

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

    // Create line generator for plotting score data
    let line = d3.line()
        .x(score => xScale(score[0]))    // Hole
        .y(score => yScale(score[1]));   // Player's score after that hole

    const path = svg.append("g")
        .selectAll("path")
        .data(playerData)
        .enter()
        .append("path")
        .classed("data-path", true)
        .attr("d", player => line(player["holeTotals"]));

    // Serialize the svg so it can be rendered into template
    return jsdom.window.document.querySelector('svg').outerHTML;

}