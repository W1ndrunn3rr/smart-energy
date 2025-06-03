import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../scripts/session_manager';
import { API_URL } from '../../definitions';
import { CircularProgress, Alert, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse } from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';

// Funkcja getUnitForMeterType może być współdzielona lub zduplikowana
const getUnitForMeterType = (meterType) => {
    switch (meterType) {
        case 'Energia elektryczna': case 'Energia klimatyzacja': return 'kWh';
        case 'Woda zimna': case 'Woda ciepła': return 'm³';
        case 'Licznik ciepła': return 'GJ';
        default: return '';
    }
};

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
            setIsLoading(false); // Zatrzymaj ładowanie, jeśli nie ma emaila
            return;
        }
        setIsLoading(true);
        setError('');
        // Zresetuj stany przed nowym pobraniem, aby uniknąć wyświetlania starych danych przy błędzie
        setUserFacility(null);
        setMeters([]);
        setReadings([]);

        try {
            // 1. Pobierz obiekt użytkownika
            const facilityResponse = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(email)}`);
            if (!facilityResponse.ok) {
                const errorData = await facilityResponse.json().catch(() => ({})); // Spróbuj sparsować błąd JSON
                throw new Error(errorData.detail || 'Nie udało się pobrać danych o Twojej firmie.');
            }
            const responseData = await facilityResponse.json(); // Poprawne parsowanie odpowiedzi

            if (!responseData || !responseData.facilities || responseData.facilities.length === 0) {
                throw new Error('Nie znaleziono firmy powiązanej z Twoim kontem.');
            }
            const facility = responseData.facilities[0]; // Dostęp do pierwszego obiektu w tablicy
            setUserFacility(facility);

            // 2. Pobierz liczniki dla obiektu
            const metersResponse = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
            if (!metersResponse.ok) {
                const errorData = await metersResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać liczników.');
            }
            const metersData = await metersResponse.json();
            setMeters(Array.isArray(metersData) ? metersData : (metersData.meters || []));

            // 3. Pobierz odczyty dla obiektu
            const readingsResponse = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}`, { cache: 'no-store' });
            if (!readingsResponse.ok) {
                const errorData = await readingsResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać odczytów.');
            }
            const readingsData = await readingsResponse.json();
            setReadings(Array.isArray(readingsData) ? readingsData : (readingsData.readings || []));

        } catch (err) {
            setError(err.message);
            // Upewnij się, że stany są resetowane w przypadku jakiegokolwiek błędu w bloku try
            setUserFacility(null);
            setMeters([]);
            setReadings([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // Tablica zależności jest pusta, co jest poprawne dla setterów stanu i stałych jak API_URL

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
    }, [userEmail, fetchUserFacilityAndData]); // Dodano fetchUserFacilityAndData do zależności

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
                return (
                    <Paper key={meter.serial_number} elevation={2} className="p-4 mb-4">
                        <Box display="flex" justifyContent="space-between" alignItems="center" onClick={() => toggleMeterExpansion(meter.serial_number)} sx={{ cursor: 'pointer' }}>
                            <Typography variant="h6" component="h3" className="text-md font-semibold text-ars-darkgrey">
                                Licznik: {meter.serial_number} <span className="font-normal text-sm">({meter.meter_type})</span>
                            </Typography>
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
                                            {meterReadings.map(reading => (
                                                <TableRow key={`${reading.meter_serial_number}-${reading.reading_date}-${reading.email}-${reading.value}`}>
                                                    <TableCell>{reading.value}</TableCell>
                                                    <TableCell>{getUnitForMeterType(meter.meter_type)}</TableCell>
                                                    <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{reading.email}</TableCell>
                                                </TableRow>
                                            ))}
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