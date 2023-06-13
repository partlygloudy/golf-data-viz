
// Module imports
import fs from "fs";


export function loadScorecardData(year, eventId) {

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
        let roundTotals = [];
        ["1", "2", "3", "4"].forEach((item) => {
            if (item in playerData["roundData"]) {
                holeScores = holeScores.concat(playerData["roundData"][item]["scoresToPar"]);
                roundTotals.push(playerData["roundData"][item]["strokes"].reduce((a, b) => a + b, 0));
            }
        })

        // Determine if player was cut or not
        let cut = holeScores.length === 36;

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
            "roundTotals": roundTotals,
            "eventTotal": roundTotals.reduce((a, b) => a + b),
            "eventScoreToPar": runningScore.at(-1),
            "runningScore": runningScore,
            "cut": cut
        }

        // Add to the full list
        formattedData.push(formattedPlayerData);

    }

    // Compute the min and max scores across all players, as well as cut line

    // Initialize at zero
    let minScore = 0;
    let maxScore = 0;
    let cutLine = 100;

    // Go through each player's scoring data
    formattedData.forEach((player) => {

        // Get player min and max score
        let playerMin = Math.min(...player["runningScore"]);
        let playerMax = Math.max(...player["runningScore"]);

        // Update field min and max
        minScore = Math.min(minScore, playerMin);
        maxScore = Math.max(maxScore, playerMax);

        if (player["cut"]) {
            let playerFinal = player["runningScore"].at(-1);
            cutLine = Math.min(cutLine, playerFinal);
        }

    });

    // Sort the players based on finishing position
    formattedData.sort(function(a, b) {

        // First sort by cut / not cut
        if (a["cut"] && !b["cut"]) return 1;
        if (!a["cut"] && b["cut"]) return -1;

        // If both players cut / not cut, sort by score
        if (a["eventTotal"] < b["eventTotal"]) return -1;
        if (a["eventTotal"] > b["eventTotal"]) return 1;

        // If players have the same score, sort alphabetically
        if (a["name"] < b["name"]) return -1;
        if (a["name"] > b["name"]) return 1;

        // Should never get here
        return 0;

    });

    // Assign leaderboard ranking to each player
    let rank = 1;
    let prevScore = formattedData[0]["eventTotal"];
    for (let i=1; i<=formattedData.length; i++) {

        // Get score for current player
        let playerScore = formattedData[i-1]["eventTotal"];

        // Update rank to i if player not tied with previous player
        if (i !== 1 && playerScore > prevScore) {
            rank = i;
        }

        formattedData[i-1]["rank"] = rank;
        prevScore = playerScore

    }


    return {
        "playerData": formattedData,
        "minScore": minScore,
        "maxScore": maxScore,
        "cutLine": cutLine
    }

}