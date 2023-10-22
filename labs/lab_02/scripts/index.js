// Get elements for interaction
const leftSide = document.getElementById('left-side');
const boroughDropdown = document.getElementById('boroughInput');
const attributeDropdown = document.getElementById('attributeInput');
const radioButtonsX = document.getElementById('optionX');
const radioButtonsY = document.getElementById('optionY');
const submitButton = document.querySelector('input[type="submit"]');

// Store attribute information
const attributeInfo = {
    categories: "categorical",
    average_hours_opened_per_day: "numerical",
    total_hours_opened_per_week: "numerical",
    review_count: "numerical",
    price: "categorical",
    stars: "numerical",
    sentiment_compound_score: "numerical",
    transactions: "categorical",
};

// Function to update the left side content based on selections
function updateLeftSide() {
    // Get the selected boroughDropdown option
    const selectedBoroughOption = boroughDropdown.value;
    selectedValues.selectedBorough = selectedBoroughOption;

    // Get the selected attributeDropdown option
    const selectedAttributeOption = attributeDropdown.value;

    // Get the selected radio button values for X and Y axes
    const selectedXAxis = radioButtonsX.checked;
    const selectedYAxis = radioButtonsY.checked;

    // Update X and Y axis attributes based on selections
    if (selectedXAxis) {
        console.log(1)
        selectedValues.xAxisAttribute = selectedAttributeOption;
    } else if (selectedYAxis) {
        console.log(2)
        selectedValues.yAxisAttribute = selectedAttributeOption;
        //update scatterplot
    }

    d3.csv('data/data.csv').then(function (data) {
        updateAllGraphs(data);
    }).catch(function (error) {
        console.log('Error loading CSV data:', error);
    });

    // Update the left side content based on selections
    leftSide.innerHTML =
        `
        <p>Selected Borough: ${selectedValues.selectedBorough}</p>
        <p>Selected X-Axis Attribute: ${selectedValues.xAxisAttribute}</p>
        <p>Selected Y-Axis Attribute: ${selectedValues.yAxisAttribute}</p>
        `;
}

// Add an event listener for the submit button
submitButton.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the form from submitting

    // Call the updateLeftSide function to update the left side content
    updateLeftSide();
});

function updateAllGraphs(data) {
    try {
        const xAttribute = selectedValues.xAxisAttribute;
        const xAttributeType = attributeInfo[xAttribute];

        //Updates Barchart/Histogram
        if (xAttributeType == "categorical") {
            const parsedData = getCategoricalAttributeCountByBorough(data);
            console.log(parsedData);
            updateBarChart(parsedData);
        } else if (xAttributeType == "numerical") {
            const parsedData = getNumericAttributeCountByBorough(data);
            console.log(parsedData)
            updateHistogram(parsedData);
        }

        // Updates Piechart
        updatePieChart(getPieChartData(data));


        // Updates Scatterplot
        if (selectedValues.xAxisAttribute !== "None selected" &&
            selectedValues.yAxisAttribute !== "None selected") {
            console.log("updating scatterplot chart");
            updateScatterPlot(getScatterplotData(data))
        }

    } catch (error) {
        console.error(error.message);
    }
}

// Function to get barchart data for categorical attributes (returns object)
function getCategoricalAttributeCountByBorough(data, attribute = selectedValues.xAxisAttribute) {
    let boroughName = selectedValues.selectedBorough;
    // let attribute = selectedValues.xAxisAttribute;

    // Filter the data for the specified borough
    const boroughData = data.filter(entry => entry.borough.toLowerCase() === boroughName);

    // Create an object to store price range counts
    const attributeCount = {};

    // Create a set to keep track of unique business IDs for the specified borough
    const uniqueBusinessIds = new Set();

    // Iterate through the filtered data and count category occurrences
    boroughData.forEach(entry => {
        const businessId = entry.business_id;
        let values;
        if (attribute === "categories") {
            values = entry.categories.split(', ').map(category => category.trim());
        } else if (attribute === "transactions") {
            values = entry.transactions.split(', ').map(transaction => transaction.trim());
        } else if (attribute === "price") {
            values = entry.price;
        }


        // Check if the business_id is unique for this borough
        if (!uniqueBusinessIds.has(businessId)) {
            uniqueBusinessIds.add(businessId);

            if (attribute === "price") {
                if (values in attributeCount) {
                    attributeCount[values]++;
                } else {
                    attributeCount[values] = 1;
                }
            } else {
                // Iterate through the categories for this entry
                values.forEach(value => {
                    if (value in attributeCount) {
                        attributeCount[value]++;
                    } else {
                        attributeCount[value] = 1;
                    }
                });
            }
        }

    });

    if (attribute === "categories") {
        // Create an array of objects with category and count properties
        const categoryArray = Object.keys(attributeCount).map(category => ({
            category,
            count: attributeCount[category],
        }));

        // Sort the array in descending order based on count
        categoryArray.sort((a, b) => b.count - a.count);

        // Slice the array to get the top 10 categories
        const top10Categories = categoryArray.slice(0, 10);

        // Create a new object to store the top 10 category counts
        const top10CategoryCounts = {};

        // Populate the top 10 category counts
        top10Categories.forEach(item => {
            top10CategoryCounts[item.category] = item.count;
        });

        return top10CategoryCounts;
    }

    return attributeCount;
}

// Function to get histogram data for categorical attributes (returns array)
function getNumericAttributeCountByBorough(data, attribute = selectedValues.xAxisAttribute) {
    let boroughName = selectedValues.selectedBorough;
    // let attribute = selectedValues.xAxisAttribute;
    console.log(boroughName);
    // Filter the data for the specified borough
    const boroughData = data.filter(entry => entry.borough.toLowerCase() === boroughName);

    // Create an object to store price range counts
    const attributeCount = [];

    // Create a set to keep track of unique business IDs for the specified borough
    const uniqueBusinessIds = new Set();

    // Iterate through the filtered data and count category occurrences
    boroughData.forEach(entry => {
        const businessId = entry.business_id;
        let value;

        if (attribute === "average_hours_opened_per_day") {
            value = entry.average_hours_opened_per_day;
        } else if (attribute == "total_hours_opened_per_week") {
            value = entry.total_hours_opened_per_week;
        } else if (attribute === "review_count") {
            value = entry.review_count;
        } else if (attribute === "stars") {
            value = entry.stars;
        } else if (attribute === "sentiment_compound_score") {
            value = entry.sentiment_compound_score;
        }

        // Check if the business_id is unique for this borough
        if (!uniqueBusinessIds.has(businessId)) {
            uniqueBusinessIds.add(businessId);
            if (attribute === "sentiment_compound_score" || attribute === "stars") {
                attributeCount.push(parseFloat(value))
            } else {
                attributeCount.push(parseInt(value))
            }
        }
    });

    return attributeCount;
}

// Function to return data specific to selected broough
function getBoroughData(data) {
    const boroughName = selectedValues.selectedBorough;

    // Filter the data for the specified borough
    const boroughData = data.filter(entry => entry.borough.toLowerCase() === boroughName);

    return boroughData;
}

// Function to get category data for the attribute category
function getCategoryDataByAttribute(data, attributeKey) {
    console.log("Inside getCategoryDataByAttribute")
    const boroughName = selectedValues.selectedBorough;

    console.log("Inside getCategoryDataByAttribute - getting top10Categories")
    const top10Categories = Object.keys(getCategoricalAttributeCountByBorough(data, "categories"))
    console.log(top10Categories)

    // Filter the data for the specified borough
    const boroughData = data.filter(entry => entry.borough.toLowerCase() === boroughName);

    // Create an object to store data per category
    const categoryData = {};

    // Create a set to keep track of unique business IDs for the specified borough
    const uniqueBusinessIds = new Set();

    if (attributeKey === "price" || attributeKey === "transactions") {
        let resultData = []
        boroughData.forEach(entry => {
            const businessId = entry.business_id;
            const categories = entry.categories.split(', ').map(category => category.trim());
            const price = entry.price;
            const name = entry.name;
            const transactions = entry.transactions.split(', ').map(transaction => transaction.trim());

            // Check if the business_id is unique for this borough
            if (!uniqueBusinessIds.has(businessId)) {
                uniqueBusinessIds.add(businessId);

                // Iterate through the categories for this entry
                categories.forEach(category => {
                    // Check if the category is in the specified categories
                    if (top10Categories.includes(category)) {
                        // Create a new data point with "categories," "price," and "name" attributes
                        transactions.forEach(transaction => {
                            resultData.push({
                                categories: category,
                                price: price,
                                name: name,
                                transactions: transaction
                            });
                        })
                    }
                });
            }
        });
        console.log(resultData);
        return resultData;
    } else {

        // Iterate through the filtered data and count category occurrences
        boroughData.forEach(entry => {
            const businessId = entry.business_id;

            // Check if the business_id is unique for this borough
            if (!uniqueBusinessIds.has(businessId)) {
                uniqueBusinessIds.add(businessId);
                const category = entry.categories.split(', ').map(category => category.trim());;
                const attributeValue = parseFloat(entry[attributeKey]); // Get the attribute value dynamically
                // Iterate through the categories for this entry
                category.forEach(value => {
                    // Check if the category is in the specified categories
                    if (top10Categories.includes(value)) {
                        if (!categoryData[value]) {
                            // Initialize the category entry if it doesn't exist
                            categoryData[value] = {
                                total: 0,
                                count: 0,
                            };
                        }

                        categoryData[value].total += attributeValue;
                        categoryData[value].count += 1;
                    }
                });
            }
        });

        console.log(categoryData)


        // Calculate the result data using the transformation function
        const resultData = Object.keys(categoryData).map(category => ({
            categories: category,
            [attributeKey]: categoryData[category].total / categoryData[category].count,
        }));
        console.log(resultData)

        return resultData;
    }
}

// Function to get data for attributes that are categorical for scatterplot
function getCategoricalDataByAttribute(data, xAttribute, yAttribute) {
    console.log("Inside getCategoricalDataByAttribute")

    if (xAttribute === yAttribute) {
        console.log(`Inside getScatterplotData - getting ${xAttribute} ${yAttribute}`);
        const resultData = [];
        const attributeInfo = Object.keys(getCategoricalAttributeCountByBorough(data, xAttribute))
        attributeInfo.forEach(value => {
            resultData.push({
                [xAttribute]: value,
            });
        });
        console.log(resultData);
        return resultData;
    }

    if (yAttribute === "categories") {
        const resultData = getCategoryDataByAttribute(data, xAttribute);
        return resultData;
    }
    const boroughData = getBoroughData(data);

    // Create a set to keep track of unique business IDs for the specified borough
    const uniqueBusinessIds = new Set();

    if (xAttribute === "price") {
        if (yAttribute === "transactions") {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = entry[xAttribute];
                    const yAttributeValue = entry[yAttribute].split(', ').map(transaction => transaction.trim()); // Get the attribute value dynamically

                    yAttributeValue.forEach(yValue => {
                        resultData.push({
                            "name": name,
                            [xAttribute]: xAttributeValue,
                            [yAttribute]: yValue,
                        });
                    })
                }
            });

            console.log(resultData)
            return resultData;

        } else if (attributeInfo[yAttribute] === "numerical") {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = entry[xAttribute];
                    const yAttributeValue = parseFloat(entry[yAttribute]); // Get the attribute value dynamically

                    resultData.push({
                        "name": name,
                        [xAttribute]: xAttributeValue,
                        [yAttribute]: yAttributeValue,
                    });
                }
            });

            console.log(resultData)
            return resultData;

        }

    } else if (xAttribute === "transactions") {
        if (yAttribute === "price") {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = entry[xAttribute].split(', ').map(transaction => transaction.trim()); // Get the attribute value dynamically];
                    const yAttributeValue = entry[yAttribute]; // Get the attribute value dynamically

                    xAttributeValue.forEach(xValue => {
                        resultData.push({
                            "name": name,
                            [xAttribute]: xValue,
                            [yAttribute]: yAttributeValue,
                        });
                    })
                }
            });

            console.log(resultData)
            return resultData;
        } else if (attributeInfo[yAttribute] === "numerical") {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = entry[xAttribute].split(', ').map(transaction => transaction.trim()); // Get the attribute value dynamically];
                    const yAttributeValue = parseFloat(entry[yAttribute]); // Get the attribute value dynamically

                    xAttributeValue.forEach(xValue => {
                        resultData.push({
                            "name": name,
                            [xAttribute]: xValue,
                            [yAttribute]: yAttributeValue,
                        });
                    })
                }
            });

            console.log(resultData)
            return resultData;

        }
    }
}

// Function to get data for attributes that are numerical for scatterplot
function getNumericDataByAttribute(data, xAttribute, yAttribute) {
    console.log("Inside getNumericDataByAttribute")

    if (xAttribute === yAttribute) {
        const attributeInfo = getNumericAttributeCountByBorough(data, xAttribute);
        console.log(attributeInfo);
        const resultData = attributeInfo.map(value => ({
            [xAttribute]: value,
        }));
        console.log(resultData);
        return resultData;
    }
    const boroughData = getBoroughData(data);

    // Create a set to keep track of unique business IDs for the specified borough
    const uniqueBusinessIds = new Set();

    if (yAttribute === "categories") {
        const resultData = getCategoryDataByAttribute(data, xAttribute);
        return resultData;
    } else if (yAttribute === "price" || yAttribute === "transactions") {
        if (yAttribute === "price") {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = parseFloat(entry.average_hours_opened_per_day);
                    const yAttributeValue = entry[yAttribute]; // Get the attribute value dynamically

                    resultData.push({
                        "name": name,
                        [xAttribute]: xAttributeValue,
                        [yAttribute]: yAttributeValue,
                    });
                }
            });

            console.log(resultData)
            return resultData;
        } else {
            let resultData = []
            // Iterate through the filtered data and count category occurrences
            boroughData.forEach(entry => {
                const businessId = entry.business_id;
                // Check if the business_id is unique for this borough
                if (!uniqueBusinessIds.has(businessId)) {
                    uniqueBusinessIds.add(businessId);
                    const name = entry.name;
                    const xAttributeValue = parseFloat(entry[xAttribute]);
                    const yAttributeValue = entry[yAttribute].split(', ').map(transaction => transaction.trim()); // Get the attribute value dynamically

                    yAttributeValue.forEach(yValue => {
                        resultData.push({
                            "name": name,
                            [xAttribute]: xAttributeValue,
                            [yAttribute]: yValue,
                        });
                    })
                }
            });

            console.log(resultData)
            return resultData;
        }
    } else {
        let resultData = []
        // Iterate through the filtered data and count category occurrences
        boroughData.forEach(entry => {
            const businessId = entry.business_id;
            // Check if the business_id is unique for this borough
            if (!uniqueBusinessIds.has(businessId)) {
                uniqueBusinessIds.add(businessId);
                const name = entry.name;
                const xAttributeValue = parseFloat(entry[xAttribute]);
                const yAttributeValue = parseFloat(entry[yAttribute]); // Get the attribute value dynamically

                resultData.push({
                    "name": name,
                    [xAttribute]: xAttributeValue,
                    [yAttribute]: yAttributeValue,
                });
            }
        });

        console.log(resultData)
        return resultData;
    }

}

// Function to get scatterplot data
function getScatterplotData(data) {
    const boroughName = selectedValues.selectedBorough;
    const xAttribute = selectedValues.xAxisAttribute;
    const yAttribute = selectedValues.yAxisAttribute;

    let parsedData;

    // Handling when x is categories
    if (xAttribute === "categories" && yAttribute === "categories") {
        console.log("Inside getScatterplotData - getting CategoryCategory");
        const categoryValues = [];
        const top10Categories = Object.keys(getCategoricalAttributeCountByBorough(data, "categories"))
        top10Categories.forEach(category => {
            categoryValues.push({
                categories: category,
            });
        });
        parsedData = categoryValues;
    } else if (xAttribute === "categories") {
        console.log(`Inside getScatterplotData - getting ${xAttribute} ${yAttribute}`);
        parsedData = getCategoryDataByAttribute(data, yAttribute);
    }

    if (xAttribute === "price" || xAttribute === "transactions") {
        parsedData = getCategoricalDataByAttribute(data, xAttribute, yAttribute);
    }

    if (attributeInfo[xAttribute] === "numerical") {
        parsedData = getNumericDataByAttribute(data, xAttribute, yAttribute);
    }

    return parsedData;
}

// Function to get pie chart data
function getPieChartData(data) {
    const xAttribute = selectedValues.xAxisAttribute;

    let parsedData;

    // Handling when xAttribute is categorical
    if (attributeInfo[xAttribute] === "categorical") {
        const dataValues = [];
        const attributeInfo = getCategoricalAttributeCountByBorough(data, xAttribute);
        Object.keys(attributeInfo).forEach(value => {
            dataValues.push({
                [xAttribute]: value,
                count: attributeInfo[value]
            });
        });

        parsedData = dataValues;
    } // Handling when xAttribute is numerical
    else {
        const countMap = new Map();
        const attributeInfo = getNumericAttributeCountByBorough(data, xAttribute);
        // Use forEach to count occurrences
        attributeInfo.forEach(value => {
            if (countMap.has(value)) {
                countMap.set(value, countMap.get(value) + 1);
            } else {
                countMap.set(value, 1);
            }
        });

        const countedData = Array.from(countMap.entries()).map(([value, count]) => ({
            [xAttribute]: value,
            count: count,
        }));

        parsedData = countedData;

    }
    console.log("Displaying piechart data");
    console.log(parsedData);
    const processedData = processAndSummarizeData(parsedData);
    console.log(processedData);
    return processedData;
}

// Helper function to process data in format appropriate for pie chart
function processAndSummarizeData(data, xAttribute = selectedValues.xAxisAttribute) {
    const countMap = new Map();
    data.forEach(item => {
        let value;
        if (attributeInfo[xAttribute] === "categorical") {
            value = item[xAttribute];
        } else {
            value = parseFloat(item[xAttribute].toFixed(2)); // Round to 2 decimal places
        }
        const key = value.toString(); // Convert to string 
        const count = item.count;
        if (countMap.has(key)) {
            countMap.set(key, countMap.get(key) + count);
        } else {
            countMap.set(key, count);
        }
    });

    // Sort in descending order
    const sortedData = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);

    // Calculate sum of the remaining values
    const remainingSum = sortedData.slice(5).reduce((sum, [, count]) => sum + count, 0);

    const finalParsedData = [
        ...sortedData.slice(0, 5).map(([xAttribute, count]) => ({
            xAttribute,
            count,
        })),
        { xAttribute: "Other", count: remainingSum },
    ];

    return finalParsedData;
}
/* =============SETTING UP CHART DIMENSIONS============= */

// set the dimensions and margins of the graph
const margin = { top: 30, bottom: 50, right: 20, left: 80 }
const width = 960;
const height = 400;

//Append the svg object to the barchart id
const barchart_histogram_svg = d3.select("#barchart-histogram")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//Append the svg object to the scatterplot id
const scatterplot_svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//Append the svg object to the piechart id
const piechart_svg = d3.select("#piechart")
    .append("svg")
    .attr("width", width)
    .attr("height", height + 100)


/* =============UPDATE CHART FUNCTIONS================= */
function updateBarChart(data) {
    let borough = selectedValues.selectedBorough;
    let xAttribute = selectedValues.xAxisAttribute;

    // Clear the previous content
    barchart_histogram_svg.selectAll("*").remove();

    //Set Axes data
    const X = Object.keys(data);
    const Y = Object.values(data);

    //Set X and Y domains
    const xDomain = X;
    const yDomain = [0, d3.max(Y)];

    //Set X and Y ranges
    const xRange = [margin.left, width - margin.right];
    const yRange = [height - margin.bottom, margin.top];

    const xScale = d3.scaleBand(xDomain, xRange).padding(0.1);
    const yScale = d3.scaleLinear(yDomain, yRange);

    //Set X and Y axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    barchart_histogram_svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    barchart_histogram_svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    barchart_histogram_svg.append("g")
        .selectAll("rect")
        .data(Object.entries(data))
        .join("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", d => yScale(0) - yScale(d[1]))
        .attr("fill", "#33C3F0");

    barchart_histogram_svg.append("text")
        .attr("class", "barchart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`top ${xAttribute} for ${borough} Barchart`);

    barchart_histogram_svg.append("text")
        .attr("class", "barchart-x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text(xAttribute);

    barchart_histogram_svg.append("text")
        .attr("class", "barchart-y-axis-label")
        .attr("transform", "rotate(270)")
        .attr("x", -height / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Frequency");
}

function updateHistogram(data) {
    let borough = selectedValues.selectedBorough;
    let xAttribute = selectedValues.xAxisAttribute;

    // Clear the previous content
    barchart_histogram_svg.selectAll("*").remove();

    const binGenerator = d3.bin().domain([d3.min(data), d3.max(data)]).thresholds(10);
    const bins = binGenerator(data);
    console.log("BIN")
    console.log(bins)

    const xDomain = [bins[0].x0, bins[bins.length - 1].x1];
    const yDomain = [0, d3.max(bins, d => d.length) + 10];

    const xRange = [margin.left, width - margin.right];
    const yRange = [height - margin.bottom, margin.top];

    const xScale = d3.scaleLinear(xDomain, xRange);
    const yScale = d3.scaleLinear(yDomain, yRange);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    barchart_histogram_svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    barchart_histogram_svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    barchart_histogram_svg.append("g")
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr("height", d => yScale(0) - yScale(d.length))
        .attr("fill", "#33C3F0");

    barchart_histogram_svg.append("text")
        .attr("class", "histogram-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${xAttribute} for ${borough} Histogram`);

    barchart_histogram_svg.append("text")
        .attr("class", "histogram-x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text(xAttribute);

    barchart_histogram_svg.append("text")
        .attr("class", "histogram-y-axis-label")
        .attr("transform", "rotate(270)")
        .attr("x", -height / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Frequency");

}

function updateScatterPlot(data) {
    const borough = selectedValues.selectedBorough;
    const xAttribute = selectedValues.xAxisAttribute;
    const yAttribute = selectedValues.yAxisAttribute;
    const xAttributeType = attributeInfo[xAttribute];
    const yAttributeType = attributeInfo[yAttribute];

    // Clear the previous content
    scatterplot_svg.selectAll("*").remove();

    //Set Axes data
    const X = d3.map(data, d => d[xAttribute]);
    const Y = d3.map(data, d => d[yAttribute]);

    //Set X and Y ranges
    const xRange = [margin.left, width - margin.right];
    const yRange = [height - margin.bottom, margin.top];

    let xDomain, yDomain;
    let xScale, yScale;

    //Set X and Y domains
    if (xAttributeType === "categorical") {
        xDomain = X;
        xScale = d3.scaleBand(xDomain, xRange).padding(1);
    } else {
        xDomain = [d3.min(X), d3.max(X)];
        xScale = d3.scaleLinear(xDomain, xRange);
    }

    if (yAttributeType === "categorical") {
        yDomain = Y;
        yScale = d3.scaleBand(yDomain, yRange).padding(0.95);
    } else {
        yDomain = [d3.min(Y), d3.max(Y)];
        yScale = d3.scaleLinear(yDomain, yRange);
    }

    //Set X and Y axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    scatterplot_svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    scatterplot_svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);

    scatterplot_svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d[xAttribute]))
        .attr("cy", d => yScale(d[yAttribute]))
        .attr("r", 5)
        .attr("fill", "#33C3F0");

    scatterplot_svg.append("text")
        .attr("class", "scatterplot-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${xAttribute} vs ${yAttribute} for ${borough}`);

    scatterplot_svg.append("text")
        .attr("class", "scatterplot-x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text(xAttribute);

    scatterplot_svg.append("text")
        .attr("class", "scatterplot-y-axis-label")
        .attr("transform", "rotate(270)")
        .attr("x", (-height / 2))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text(yAttribute);

}

function updatePieChart(data) {
    // Clear the previous content
    piechart_svg.selectAll("*").remove();

    let xAttribute = selectedValues.xAxisAttribute;
    let selectedBorough = selectedValues.selectedBorough;

    var g = piechart_svg.append("g")
        .attr("transform", "translate(" + width/2 + "," + ((height/2)+50) + ")");

    var ordScale = d3.scaleOrdinal()
        .domain(data)
        .range(['#ffd384', '#94ebcd', '#fbaccc', '#d3e0ea', '#fa7f72', '#33C3F0']);

    var pie = d3.pie().value(function (d) {
        return d.count;
    });

    var arc = g.selectAll("arc")
        .data(pie(data))
        .enter();

    var path = d3.arc()
        .outerRadius(200)
        .innerRadius(0);

    arc.append("path")
        .attr("d", path)
        .attr("fill", function (d) {
            return ordScale(d.data.xAttribute);
        });

    // Create a legend container
    var legend = piechart_svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width - 200) + "," + 20 + ")");

    // Create legend items
    var legendItems = legend.selectAll(".legend-item")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", function (d, i) {
            return "translate(0," + (i * 20) + ")";
        });

    legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function (d) {
            return ordScale(d.xAttribute);
        });

    legendItems.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function (d) {
            return d.xAttribute;
        });

    piechart_svg.append("text")
        .attr("class", "piechart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(`${xAttribute} frequency for ${selectedBorough}`);
        
}