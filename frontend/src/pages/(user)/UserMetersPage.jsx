import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../scripts/session_manager';
import { API_URL } from '../../definitions';
import { CircularProgress, Alert, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse } from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon, WarningAmber as WarningAmberIcon } from '@mui/icons-material';

/**
 * Zwraca jednostkę dla danego typu licznika.
 * @function getUnitForMeterType
 * @param {string} meterType - Typ licznika.
 * @returns {string} Jednostka (np. 'kWh', 'm³', 'GJ').
 */
const getUnitForMeterType = (meterType) => {
    switch (meterType) {
        case 'Energia elektryczna': case 'Energia klimatyzacja': return 'kWh';
        case 'Woda zimna': case 'Woda ciepła': return 'm³';
        case 'Licznik ciepła': return 'GJ';
        default: return '';
    }
};

/**
 * @function UserMetersPage
 * @returns {JSX.Element} Strona użytkownika do podglądu liczników i odczytów.
 */
const UserMetersPage = () => {
    const [userEmail, setUserEmail] = useState('');
    const [userFacility, setUserFacility] = useState(null);
    const [meters, setMeters] = useState([]);
    const [readings, setReadings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedMeters, setExpandedMeters] = useState({});

    const fetchUserFacilityAndData = useCallback(async (email) => {
        if (!email) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        setUserFacility(null);
        setMeters([]);
        setReadings([]);

        try {
            const facilityResponse = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(email)}`);
            if (!facilityResponse.ok) {
                const errorData = await facilityResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać danych o Twojej firmie.');
            }
            const responseData = await facilityResponse.json();

            if (!responseData || !responseData.facilities || responseData.facilities.length === 0) {
                throw new Error('Nie znaleziono firmy powiązanej z Twoim kontem.');
            }
            const facility = responseData.facilities[0];
            setUserFacility(facility);

            const metersResponse = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
            if (!metersResponse.ok) {
                const errorData = await metersResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać liczników.');
            }
            const metersData = await metersResponse.json();
            setMeters(Array.isArray(metersData) ? metersData : (metersData.meters || []));

            const readingsResponse = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}`, { cache: 'no-store' });
            if (!readingsResponse.ok) {
                const errorData = await readingsResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać odczytów.');
            }
            const readingsData = await readingsResponse.json();
            setReadings(Array.isArray(readingsData) ? readingsData : (readingsData.readings || []));

        } catch (err) {
            setError(err.message);
            setUserFacility(null);
            setMeters([]);
            setReadings([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const email = sessionManager.getUserEmail();
        if (email) {
            setUserEmail(email);
        } else {
            setError("Brak identyfikacji użytkownika.");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userEmail) {
            fetchUserFacilityAndData(userEmail);
        }
    }, [userEmail, fetchUserFacilityAndData]);

    const toggleMeterExpansion = (meterSerialNumber) => {
        setExpandedMeters(prev => ({ ...prev, [meterSerialNumber]: !prev[meterSerialNumber] }));
    };

    if (isLoading) return <div className="p-6 flex justify-center items-center h-screen"><CircularProgress /></div>;

    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Podgląd Liczników</h1>
            {error && <Alert severity="error" className="mb-4">{error}</Alert>}
            {userFacility && <Typography variant="h5" className="mb-4">Liczniki dla firmy: <strong>{userFacility.name}</strong></Typography>}

            {meters.length === 0 && !isLoading && !error && (
                <Typography>Brak liczników do wyświetlenia.</Typography>
            )}

            {meters.map(meter => {
                const meterReadings = readings.filter(r => r.meter_serial_number === meter.serial_number)
                    .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
                const isExpanded = !!expandedMeters[meter.serial_number];

                const latest = meterReadings[0];
                const previous = meterReadings[1];
                const isWarning = latest && previous && parseFloat(latest.value) < parseFloat(previous.value);

                return (
                    <Paper key={meter.serial_number} elevation={2} className="p-4 mb-4">
                        <Box display="flex" justifyContent="space-between" alignItems="center" onClick={() => toggleMeterExpansion(meter.serial_number)} sx={{ cursor: 'pointer' }}>
                            <Box>
                                <Typography variant="h6" component="h3" className="text-md font-semibold text-ars-darkgrey">
                                    Licznik: {meter.serial_number} <span className="font-normal text-sm">({meter.meter_type})</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                    Opis: {meter.description && meter.description.trim() !== '' ? meter.description : <span style={{ color: '#aaa' }}>Brak opisu</span>}
                                </Typography>
                            </Box>
                            <IconButton size="small">
                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {meterReadings.length > 0 ? (
                                <TableContainer sx={{ mt: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Wartość</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Jednostka</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Data Odczytu</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Zarejestrował</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {meterReadings.map(reading => {
                                                const highlight = latest && previous && reading.reading_id === latest.reading_id && parseFloat(latest.value) < parseFloat(previous.value);
                                                return (
                                                    <TableRow
                                                        key={`${reading.meter_serial_number}-${reading.reading_date}-${reading.email}-${reading.value}`}
                                                        sx={highlight ? { backgroundColor: '#ffe066' } : {}}
                                                    >
                                                        <TableCell>{reading.value}</TableCell>
                                                        <TableCell>{getUnitForMeterType(meter.meter_type)}</TableCell>
                                                        <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                                                        <TableCell>{reading.email}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {isWarning && (
                                                <TableRow>
                                                    <TableCell colSpan={4} sx={{ backgroundColor: '#ffe066', color: '#b26a00', fontWeight: 'bold', display: 'flex', alignItems: 'center', borderBottom: 'none' }}>
                                                        <WarningAmberIcon sx={{ color: '#b26a00', mr: 1 }} />
                                                        Uwaga: Najnowszy odczyt jest mniejszy niż poprzedni! Sprawdź poprawność danych.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography className="text-sm text-ars-darkgrey italic p-2">Brak odczytów dla tego licznika.</Typography>
                            )}
                        </Collapse>
                    </Paper>
                );
            })}
        </div>
    );
};

export default UserMetersPage;