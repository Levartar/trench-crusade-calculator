// Import D3 from the served modules path
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add click event listener to the button
    document.getElementById("calculateButton").addEventListener("click", runSimulation);
});

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

// Main function to simulate hitting and wounding calculations
export function runSimulation() {
    // Get base hit and wound chances
    let hitChance = parseInt(document.getElementById("hitChance").value);
    let woundChance = parseInt(document.getElementById("woundChance").value);
    const armor = parseInt(document.getElementById("armor").value);

    // Adjust hitChance based on modifiers
    if (document.getElementById("cover").checked) hitChance -= 1;
    if (document.getElementById("longRange").checked) hitChance -= 1;
    if (document.getElementById("elevatedPosition").checked) hitChance += 1;

    // Adjust woundChance based on modifiers
    if (document.getElementById("targetDown").checked) woundChance += 1;
    if (document.getElementById("fear").checked) woundChance -= 1;

    // Simulation variables
    const numRolls = 10000;
    let hits = 0;
    let crits = 0;
    let minorHits = 0;
    let downs = 0;
    let outs = 0;

    for (let i = 0; i < numRolls; i++) {
        // Hit roll
        const hitRoll = rollAndPick(hitChance);
        const isHit = hitRoll > 6;
        const isCrit = hitRoll === 12;

        if (isHit) {
            hits++;
            if (isCrit){
                crits++;
            }
            
            // Wound roll, adjusted for armor
            let woundRoll = rollAndPick(woundChance) - armor;

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

    // Calculate percentages
    const hitRate = (hits / numRolls) * 100;
    const critRate = (crits / numRolls) * 100;
    const minorHitRate = (minorHits / numRolls) * 100;
    const downRate = (downs / numRolls) * 100;
    const outRate = (outs / numRolls) * 100;

    // Display results
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <p>Hit Rate: ${hitRate.toFixed(2)}%</p>
        <p>Crit Rate: ${critRate.toFixed(2)}%</p>
        <p>Minor Hits: ${minorHitRate.toFixed(2)}%</p>
        <p>Downs: ${downRate.toFixed(2)}%</p>
        <p>Outs: ${outRate.toFixed(2)}%</p>
    `;

    // Generate chart using D3
    const data = [
        { label: "Hits", value: hitRate },
        { label: "Minor Hits", value: minorHitRate },
        { label: "Downs", value: downRate },
        { label: "Outs", value: outRate },
    ];

    // Clear any previous SVG
    d3.select("#chart").selectAll("*").remove();

    const width = 400, height = 300;
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([height, 0]);

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))
        .attr("fill", "red");

    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
}