import React from 'react';
import { Container, Typography } from '@mui/material';
import CSVChart from "./components/CSVChart";

function App() {
    return (
        <div>
            <Typography variant="h4" align="center" gutterBottom>
                Cash Flow Analyzer
            </Typography>
            <CSVChart />
        </div>
    );
}

export default App;
