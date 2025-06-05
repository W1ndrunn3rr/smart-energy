import React from 'react';
import { sessionManager } from '../../scripts/session_manager';
import { Typography, Box, Paper } from '@mui/material';

const TechnicianHomePage = () => {
    const userEmail = sessionManager.getUserEmail();

    return (
        <Box className="p-6 bg-ars-whitegrey mb-6" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Paper className="p-8" elevation={3} sx={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
                <Typography variant="h3" className="mb-6 text-ars-deepblue" gutterBottom>
                    Panel Technika
                </Typography>
                <Typography variant="h6" className="mb-4">
                    Witaj <strong>{userEmail}</strong> w panelu technika.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Jeśli potrzebujesz pomocy, skontaktuj się z administratorem systemu.
                </Typography>
            </Paper>
        </Box>
    );
};

export default TechnicianHomePage;