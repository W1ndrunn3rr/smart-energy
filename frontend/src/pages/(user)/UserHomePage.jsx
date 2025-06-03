import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../scripts/session_manager';
import { API_URL } from '../../definitions';
import { CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Paper, Typography, Box } from '@mui/material';
// W przyszłości możesz dodać bibliotekę do wykresów, np. Recharts
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const getCurrentYear = () => new Date().getFullYear();

const UserHomePage = () => {
    const [userEmail, setUserEmail] = useState('');
    const [userFacility, setUserFacility] = useState(null);
    const [facilityReadings, setFacilityReadings] = useState([]);
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const email = sessionManager.getUserEmail();
        if (email) {
            setUserEmail(email);
        } else {
            setError("Nie udało się zidentyfikować użytkownika. Zaloguj się ponownie.");
            setIsLoading(false);
        }
    }, []);

    const fetchUserFacility = useCallback(async (email) => {
        if (!email) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(email)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać danych o Twojej firmie.');
            }
            const responseData = await response.json();
            if (responseData && responseData.facilities && responseData.facilities.length > 0) {
                setUserFacility(responseData.facilities[0]);
                // Stan isLoading zostanie ustawiony na false przez fetchFacilityReadings
            } else {
                // Ten błąd zostanie przechwycony przez blok catch poniżej
                throw new Error('Nie znaleziono firmy powiązanej z Twoim kontem.');
            }
        } catch (err) {
            setError(err.message);
            setUserFacility(null);
            setIsLoading(false); // Kluczowe: ustawienie isLoading na false w przypadku błędu
        }
        // Usunięto blok finally, który powodował błąd ReferenceError
    }, []); // Poprawiona tablica zależności

    useEffect(() => {
        if (userEmail) {
            fetchUserFacility(userEmail);
        }
    }, [userEmail, fetchUserFacility]);

    const fetchFacilityReadings = useCallback(async (facilityName) => {
        if (!facilityName) {
            setIsLoading(false); // Dodatkowe zabezpieczenie, jeśli facilityName jest null
            return;
        }
        // setIsLoading(true) nie jest tutaj potrzebne, jeśli jest już ustawione
        setError('');
        try {
            const response = await fetch(`${API_URL}/readings/${encodeURIComponent(facilityName)}`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się pobrać odczytów dla Twojej firmy.');
            }
            const readings = await response.json();
            setFacilityReadings(Array.isArray(readings) ? readings : (readings.readings || []));
        } catch (err) {
            setError(err.message);
            setFacilityReadings([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userFacility) {
            fetchFacilityReadings(userFacility.name);
        }
    }, [userFacility, fetchFacilityReadings]);

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
        // Ponowne pobieranie lub filtrowanie odczytów nie jest tu konieczne,
        // jeśli `fetchFacilityReadings` pobiera wszystkie, a filtrowanie odbywa się przy renderowaniu.
        // Jeśli API wspiera filtrowanie po roku, można by tu wywołać fetch.
    };

    // Przykładowa funkcja do agregacji danych dla wykresu
    const getChartData = () => {
        if (!facilityReadings || facilityReadings.length === 0) return [];

        const yearlyReadings = facilityReadings.filter(r => new Date(r.reading_date).getFullYear() === selectedYear);
        const monthlyConsumption = {};

        yearlyReadings.forEach(reading => {
            const month = new Date(reading.reading_date).getMonth(); // 0 (Sty) - 11 (Gru)
            if (!monthlyConsumption[month]) {
                monthlyConsumption[month] = 0;
            }
            monthlyConsumption[month] += parseFloat(reading.value || 0);
        });

        const monthNames = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
        return Object.keys(monthlyConsumption).map(monthKey => ({
            month: monthNames[parseInt(monthKey)],
            consumption: monthlyConsumption[monthKey].toFixed(2)
        })).sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));
    };

    const chartData = getChartData();

    if (isLoading) {
        return <div className="p-6 flex justify-center items-center h-screen"><CircularProgress /></div>;
    }

    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Panel Klienta</h1>
            <p className="mb-4 text-lg">Witaj {userEmail}!</p>

            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            {userFacility && (
                <Paper elevation={3} className="p-6">
                    <Typography variant="h5" component="h2" className="text-ars-deepblue mb-4">
                        Podsumowanie dla firmy: <strong>{userFacility.name}</strong>
                    </Typography>
                    <FormControl variant="outlined" sx={{ mb: 3, minWidth: 120 }}>
                        <InputLabel id="year-select-label">Rok</InputLabel>
                        <Select
                            labelId="year-select-label"
                            value={selectedYear}
                            onChange={handleYearChange}
                            label="Rok"
                        >
                            {/* Możesz dynamicznie generować listę lat */}
                            {[getCurrentYear(), getCurrentYear() - 1, getCurrentYear() - 2].map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography variant="h6" className="text-ars-darkgrey mb-2">
                        Całkowite zużycie w {selectedYear}:
                    </Typography>
                    {chartData.length > 0 ? (
                        <Box sx={{ /* W przyszłości tu będzie komponent wykresu */ height: 300, border: '1px dashed grey', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            {/* <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="consumption" fill="#8884d8" name="Zużycie" />
                                </BarChart>
                            </ResponsiveContainer> */}
                            <Typography className="mb-2">Dane do wykresu (miesięczne zużycie):</Typography>
                            <ul>
                                {chartData.map(item => (
                                    <li key={item.month}>{item.month}: {item.consumption}</li>
                                ))}
                            </ul>
                            <Typography variant="caption" sx={{ mt: 2 }}>(Placeholder dla wykresu)</Typography>
                        </Box>
                    ) : (
                        <Typography className="text-ars-darkgrey italic">Brak danych o zużyciu dla wybranego roku ({selectedYear}).</Typography>
                    )}
                </Paper>
            )}
        </div>
    );
};
export default UserHomePage;