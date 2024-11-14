// Import D3 from the served modules path
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add click event listener to the button
    document.getElementById("calculateButton").addEventListener("click", runSimulation);
    document.getElementById("toggleBloodMarkers").addEventListener("click",toggleBloodMarkerCalculations);
});

function toggleBloodMarkerCalculations() {
    const bloodMarkerResults = document.querySelectorAll("#results > [id*='Blood']");

    bloodMarkerResults.forEach(div => {
        div.style.display = div.style.display === "none" ? "block" : "none";
    });
}

// Utility function to roll a single d6
function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
}

// Function to simulate the roll based on the selected option (e.g., 4d6 pick 2 highest)
function rollAndPick(option) {
    const rolls = [];
    let result = 0;

    // Roll based on option value
    const numDice = Math.abs(option) + 2;
    for (let i = 0; i < numDice; i++) {
        rolls.push(rollD6());
    }
    
    // Sort rolls to pick either highest or lowest two
    rolls.sort((a, b) => a - b);
    if (option < 0) {
        // Pick the 2 lowest values
        result = rolls[0] + rolls[1];
    } else {
        // Pick the 2 highest values
        result = rolls[rolls.length - 1] + rolls[rolls.length - 2];
    }

    return result;
}

// Calculate outcomes for various blood marker configurations
function calculateOutcomes(baseHitChance, baseWoundChance, armor) {
    const scenarios = {
        "neutral": { hitAdjust: 0, woundAdjust: 0 },
        "PlusBloodBoth": { hitAdjust: +1, woundAdjust: +1 },
        "PlusBloodHit": { hitAdjust: +1, woundAdjust: 0 },
        "PlusBloodWound": { hitAdjust: 0, woundAdjust: +1 },
        "MinusBloodBoth": { hitAdjust: -1, woundAdjust: -1 },
        "MinusBloodHit": { hitAdjust: -1, woundAdjust: 0 },
        "MinusBloodWound": { hitAdjust: 0, woundAdjust: -1 }
    };

    Object.entries(scenarios).forEach(([key, { hitAdjust, woundAdjust }]) => {
        const hitChance = baseHitChance + hitAdjust;
        const woundChance = baseWoundChance + woundAdjust;
        const results = simulateOutcomes(hitChance, woundChance, armor);

        displayResults(key, results);
        createChart(key, results);
    });
}

// Function to run the simulation for each configuration
function simulateOutcomes(hitChance, woundChance, armor) {
    const numRolls = 10000;
    let hits = 0, crits = 0, minorHits = 0, downs = 0, outs = 0;

    for (let i = 0; i < numRolls; i++) {
        const hitRoll = rollAndPick(hitChance);
        const isHit = hitRoll > 6;
        const isCrit = hitRoll === 12;

        if (isHit) {
            hits++;
            if(isCrit){crits++}

            let woundRoll = rollAndPick(woundChance) + armor;

            if (woundRoll <= 1) {
                // No wound
            } else if (woundRoll < 7) {
                minorHits++;
            } else if (woundRoll < 9) {
                downs++;
            } else {
                outs++;
            }
        }
    }

    return {
        hitRate: (hits / numRolls) * 100,
        critRate: (crits / numRolls) * 100,
        minorHitRate: (minorHits / numRolls) * 100,
        downRate: (downs / numRolls) * 100,
        outRate: (outs / numRolls) * 100,
    };
}

// Function to display results for each scenario
function displayResults(scenario, results) {
    const resultDiv = document.getElementById(`result${scenario}`);
    resultDiv.innerHTML = `
        <h3>${scenario}</h6>
        <p>Hit Rate: ${results.hitRate.toFixed(2)}%</p>
        <p>Crit Rate: ${results.critRate.toFixed(2)}%</p>
        <p>Minor Hits: ${results.minorHitRate.toFixed(2)}%</p>
        <p>Downs: ${results.downRate.toFixed(2)}%</p>
        <p>Outs: ${results.outRate.toFixed(2)}%</p>
    `;
}

// Function to create a chart for each scenario using D3
function createChart(scenario, results) {
    const data = [
        { label: "Hits", value: results.hitRate },
        { label: "Minor Hits", value: results.minorHitRate },
        { label: "Downs", value: results.downRate },
        { label: "Outs", value: results.outRate },
    ];
    //remove old charts
    d3.select(`#chart${scenario}`).selectAll("*").remove();

    
    const margin = { top: 20, right: 10, bottom: 40, left: 40 };
    const width = 200-margin.left-margin.right, height = 100;

    const svg = d3.select(`#chart${scenario}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Set the x and y scales
const x = d3.scaleBand()
    .domain(data.map(d => d.label)) // Use labels from data
    .range([0, width])
    .padding(0.4); // Adjusted for thinner bars

const y = d3.scaleLinear()
    .domain([0, 100]) // This ensures y-axis is always at 100%
    .range([height, 0]);

// Draw bars
svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.label))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth() / 2) // Make bars thinner
    .attr("height", (d) => height - y(d.value))
    .attr("fill", "#f28b82"); // Soft red color

// Add x-axis
svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)) // Use labels from data
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

// Add y-axis with percentage
svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d).toFixed(0)}%`));

// Add labels to bars
svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 4) // Position text in the middle of the bar
    .attr("y", (d) => y(d.value) - 5) // Position text just above the bar
    .text((d) => `${(d.value).toFixed(1)}%`) // Display percentage label
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#FFFFFF");
}

// Main function to initiate all simulations
export function runSimulation() {
    let baseHitChance = parseInt(document.getElementById("hitChance").value);
    let baseWoundChance = parseInt(document.getElementById("woundChance").value);
    const armor = parseInt(document.getElementById("armor").value);

        // Adjust hitChance based on modifiers
        if (document.getElementById("cover").checked) baseHitChance -= 1;
        if (document.getElementById("longRange").checked) baseHitChance -= 1;
        if (document.getElementById("elevatedPosition").checked) baseHitChance += 1;
    
        // Adjust woundChance based on modifiers
        if (document.getElementById("targetDown").checked) baseWoundChance += 1;
        if (document.getElementById("fear").checked) baseWoundChance -= 1;

    calculateOutcomes(baseHitChance, baseWoundChance, armor);
}