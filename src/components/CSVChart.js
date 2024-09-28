import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { Card, CardContent, Grid, Typography, TextField } from "@mui/material";

function CSVChart() {
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [cashFlowParams, setCashFlowParams] = useState({
        currentCashFlow: "",
        growthRate: "",
        discountRate: "",
        terminalGrowthRate: "",
        marketCap: "",
        years: "",
    });
    const [cashFlowGrowth, setCashFlowGrowth] = useState([]);
    const [discountedCashFlowGrowth, setDiscountedCashFlowGrowth] = useState([]);
    const [cashFlowGrowthTotal, setCashFlowGrowthTotal] = useState(0);
    const [discountedCashFlowGrowthTotal, setDiscountedCashFlowGrowthTotal] = useState(0);
    const [terminalGrowthValue, setTerminalGrowthValue] = useState(0);
    const [discountedTerminalValue, setDiscountedTerminalValue] = useState(0);
    const [totalPresentValue, setTotalPresentValue] = useState(0);

    useEffect(() => {
        const { currentCashFlow, growthRate, discountRate, terminalGrowthRate, marketCap, years } = cashFlowParams;
        if (
            currentCashFlow &&
            growthRate &&
            discountRate &&
            terminalGrowthRate &&
            marketCap &&
            years
        ) {
            calculateDCF();
        }
    }, [cashFlowParams]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                complete: (result) => {
                    const rows = result.data;
                    const headerRow = rows[0].slice(1); // Skipping first column for the x-axis (dates)
                    setHeaders(headerRow);
                    setCsvData(rows.slice(2)); // Rows excluding the first two rows (Period Ending & Report Filing)
                },
                header: false,
            });
        }
    };

    const getChartData = (row) => {
        return {
            labels: headers.slice(0).reverse(),
            datasets: [
                {
                    label: row[0], // The name of the dataset (e.g., "Revenue", "Cost of Revenue", etc.)
                    data: row.slice(1).reverse().map((value) => parseFloat(value.replace(/[^0-9.-]+/g, ""))),
                    borderColor: "rgba(75,192,192,1)",
                    fill: false,
                },
            ],
        };
    };

    const calculateDCF = () => {
        const { currentCashFlow, growthRate, discountRate, terminalGrowthRate, years } = cashFlowParams;

        const growthRateDecimal = parseFloat(growthRate) / 100;
        const discountRateDecimal = parseFloat(discountRate) / 100;
        const terminalGrowthRateDecimal = parseFloat(terminalGrowthRate) / 100;
        const cashFlowGrowthData = [];
        const discountedCashFlowData = [];

        let cashFlow = parseFloat(currentCashFlow);
        let discountedCashFlowTotal = 0;
        let cashFlowTotal = 0;

        for (let year = 1; year <= years; year++) {
            cashFlow = cashFlow * (1 + growthRateDecimal);

            const discountedCashFlow = cashFlow / Math.pow(1 + discountRateDecimal, year);

            cashFlowGrowthData.push(cashFlow);
            discountedCashFlowData.push(discountedCashFlow);

            cashFlowTotal += cashFlow;
            discountedCashFlowTotal += discountedCashFlow;
        }

        const lastYearCashFlow = cashFlowGrowthData[cashFlowGrowthData.length - 1];
        const terminalGrowthValue = (lastYearCashFlow * (1 + terminalGrowthRateDecimal)) / (discountRateDecimal - terminalGrowthRateDecimal);
        const discountedTerminalValue = terminalGrowthValue / Math.pow(1 + discountRateDecimal, years);
        const totalPresentValue = discountedTerminalValue + discountedCashFlowTotal;

        setCashFlowGrowth(cashFlowGrowthData);
        setDiscountedCashFlowGrowth(discountedCashFlowData);
        setCashFlowGrowthTotal(cashFlowTotal);
        setDiscountedCashFlowGrowthTotal(discountedCashFlowTotal);
        setTerminalGrowthValue(terminalGrowthValue);
        setDiscountedTerminalValue(discountedTerminalValue);
        setTotalPresentValue(totalPresentValue);
    };

    const calculateCAGR = (data, periods) => {
        const values = data.slice(-periods);
        if (values.length < 2) return null;

        const startValue = parseFloat(values[0].replace(/[^0-9.-]+/g, ""));
        const endValue = parseFloat(values[values.length - 1].replace(/[^0-9.-]+/g, ""));

        if (startValue <= 0 || endValue <= 0 || isNaN(startValue) || isNaN(endValue)) return null;

        return (((endValue / startValue) ** (1 / periods)) - 1) * 100;
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setCashFlowParams((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const marketCapValue = parseFloat(cashFlowParams.marketCap);
    const percentageDifference = marketCapValue ? ((totalPresentValue - marketCapValue) / marketCapValue) * 100 : 0;

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Discounted Cash Flow Analysis
            </Typography>
            <Grid container spacing={2} alignItems="center">
                {Object.keys(cashFlowParams).map((key) => (
                    <Grid item xs={12} md={4} key={key}>
                        <TextField
                            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                            name={key}
                            value={cashFlowParams[key]}
                            onChange={handleInputChange}
                            fullWidth
                            type={key === "years" ? "number" : "text"}
                            inputProps={key === "years" ? { min: 5, max: 10 } : {}}
                        />
                    </Grid>
                ))}
            </Grid>

            {cashFlowGrowth.length > 0 && discountedCashFlowGrowth.length > 0 && (
                <Grid container spacing={2} style={{ marginTop: "20px" }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Cash Flow Growth Graph
                        </Typography>
                        <div style={{ position: "relative", height: "200px", width: "100%" }}>
                            <Line
                                data={{
                                    labels: Array.from({ length: cashFlowParams.years }, (_, i) => `Year ${i + 1}`),
                                    datasets: [
                                        {
                                            label: "Cash Flow Growth",
                                            data: cashFlowGrowth,
                                            borderColor: "rgba(75,192,192,1)",
                                            fill: false,
                                        },
                                        {
                                            label: "Discounted Cash Flow Growth",
                                            data: discountedCashFlowGrowth,
                                            borderColor: "rgba(192,75,75,1)",
                                            fill: false,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false, // Keep this to allow height adjustment
                                }}
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Results</Typography>
                                <Typography variant="body1">
                                    <strong>Cash Flow Growth Total:</strong> {cashFlowGrowthTotal.toFixed(2)} billions
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Discounted Cash Flow Growth Total:</strong> {discountedCashFlowGrowthTotal.toFixed(2)} billions
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Terminal Value:</strong> {terminalGrowthValue.toFixed(2)} billions
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Discounted Terminal Value:</strong> {discountedTerminalValue.toFixed(2)} billions
                                </Typography>

                                <br />

                                <Typography variant="body1">
                                    <strong>Total Present Value:</strong> {totalPresentValue.toFixed(2)} billions
                                </Typography>

                                <Typography variant="body1">
                                    <strong>Current Market Cap:</strong> {cashFlowParams.marketCap} billions
                                </Typography>

                                <Typography variant="body1" color={percentageDifference > 0 ? "green" : "red"}>
                                    <strong>Difference:</strong> {percentageDifference.toFixed(2)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <hr />

            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ marginBottom: "20px" }}
            />

            <Grid container spacing={3}>
                {csvData.length > 0 && headers.length > 0 ? (
                    csvData.map((row, index) => {
                        const data = row.slice(1).reverse();
                        const cagr5 = calculateCAGR(data, 5);
                        const cagr10 = calculateCAGR(data, 10);
                        const cagr15 = calculateCAGR(data, 15);
                        const cagr20 = calculateCAGR(data, 20);

                        return (
                            <Grid container item spacing={3} xs={12} key={index}>
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <h3>{row[0]}</h3> {/* Row name as title */}
                                            <Line data={getChartData(row)} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">CAGR</Typography>
                                            <ul>
                                                <li>5 Years: {cagr5 ? cagr5.toFixed(2) + "%" : "N/A"}</li>
                                                <li>10 Years: {cagr10 ? cagr10.toFixed(2) + "%" : "N/A"}</li>
                                                <li>15 Years: {cagr15 ? cagr15.toFixed(2) + "%" : "N/A"}</li>
                                                <li>20 Years: {cagr20 ? cagr20.toFixed(2) + "%" : "N/A"}</li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        );
                    })
                ) : (
                    <p>Please upload a CSV file to visualize the data.</p>
                )}
            </Grid>
        </div>
    );
}

export default CSVChart;
