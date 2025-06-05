import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../scripts/session_manager';
import { API_URL } from '../../definitions';
import {
    CircularProgress, Alert, Paper, Typography, Box,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COMMON_METER_TYPES = [
    'Energia elektryczna',
    'Energia klimatyzacja',
    'Woda zimna',
    'Woda ciepła',
    'Licznik ciepła'
];

const getCurrentYear = () => new Date().getFullYear();

const UserHomePage = () => {
    const userEmail = sessionManager.getUserEmail();
    const [facility, setFacility] = useState(null);
    const [readings, setReadings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());

    // Dla wykresu zbiorczego
    const [selectedMeterType, setSelectedMeterType] = useState(COMMON_METER_TYPES[0]);
    // Dla wykresu pojedynczego licznika
    const [selectedSerial, setSelectedSerial] = useState('');

    // Pobierz facility i odczyty po zalogowaniu
    useEffect(() => {
        const fetchFacilityAndReadings = async () => {
            setIsLoading(true);
            setError('');
            try {
                // 1. Pobierz facility przypisane do użytkownika
                const facilityRes = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(userEmail)}`);
                if (!facilityRes.ok) throw new Error('Nie udało się pobrać obiektu.');
                const facilityData = await facilityRes.json();
                const userFacility = Array.isArray(facilityData.facilities)
                    ? facilityData.facilities[0]
                    : (facilityData.facilities || [])[0];
                if (!userFacility) throw new Error('Nie znaleziono przypisanego obiektu.');
                setFacility(userFacility);

                // 2. Pobierz odczyty dla tego obiektu i wybranego typu licznika
                const readingsRes = await fetch(`${API_URL}/readings/${encodeURIComponent(userFacility.name)}/${encodeURIComponent(selectedMeterType)}`);
                if (!readingsRes.ok) throw new Error('Nie udało się pobrać odczytów.');
                const readingsData = await readingsRes.json();
                setReadings(Array.isArray(readingsData) ? readingsData : (readingsData.readings || []));
            } catch (err) {
                setError(err.message);
                setFacility(null);
                setReadings([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (userEmail) fetchFacilityAndReadings();
    // eslint-disable-next-line
    }, [userEmail, selectedMeterType]);

    // --- Agregacja do wykresu zbiorczego ---
    const getAggregateChartData = () => {
        if (!readings || readings.length === 0) return [];

        // Grupuj odczyty po liczniku
        const meters = {};
        readings.forEach(r => {
            if (!meters[r.meter_serial_number]) meters[r.meter_serial_number] = [];
            meters[r.meter_serial_number].push(r);
        });

        // Przygotuj sumę miesięczną dla wszystkich liczników
        const monthlySum = Array(12).fill(0);

        Object.values(meters).forEach(meterReadings => {
            // Tylko odczyty z wybranego roku lub wcześniejsze (do różnic)
            const sorted = meterReadings
                .map(r => ({ ...r, dateObj: new Date(r.reading_date) }))
                .sort((a, b) => a.dateObj - b.dateObj);

            let lastValue = null;
            let lastMonth = null;

            // Przechodzimy po wszystkich odczytach tego licznika
            for (let i = 0; i < sorted.length; i++) {
                const { dateObj, value } = sorted[i];
                const year = dateObj.getFullYear();
                const month = dateObj.getMonth();

                if (year > selectedYear) continue; // pomijamy przyszłość

                // Jeśli to pierwszy odczyt w historii licznika i jest w wybranym roku
                if (lastValue === null && year === selectedYear) {
                    monthlySum[month] += parseFloat(value || 0);
                }
                // Jeśli to kolejny odczyt w wybranym roku
                else if (lastValue !== null && year === selectedYear) {
                    // Zużycie = różnica względem poprzedniego odczytu (niezależnie od miesiąca)
                    const diff = parseFloat(value || 0) - lastValue;
                    if (diff > 0) monthlySum[month] += diff;
                }
                // Aktualizuj ostatni odczyt
                lastValue = parseFloat(value || 0);
                lastMonth = month;
            }
        });

        const monthNames = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
        return monthNames.map((name, idx) => ({
            month: name,
            consumption: monthlySum[idx].toFixed(2)
        }));
    };

    // --- Agregacja do wykresu pojedynczego licznika ---
    const getSingleMeterChartData = () => {
        if (!readings || readings.length === 0 || !selectedSerial) return [];
        const filtered = readings.filter(r =>
            new Date(r.reading_date).getFullYear() === selectedYear &&
            r.meter_serial_number === selectedSerial
        );
        const monthlyConsumption = {};
        filtered.forEach(reading => {
            const month = new Date(reading.reading_date).getMonth();
            if (!monthlyConsumption[month]) monthlyConsumption[month] = 0;
            monthlyConsumption[month] += parseFloat(reading.value || 0);
        });
        const monthNames = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
        return monthNames.map((name, idx) => ({
            month: name,
            consumption: monthlyConsumption[idx]?.toFixed(2) || "0.00"
        }));
    };

    // Lista dostępnych lat i liczników
    const availableYears = [...new Set(readings.map(r => new Date(r.reading_date).getFullYear()))].sort((a, b) => b - a);
    const availableSerials = [...new Set(readings.map(r => r.meter_serial_number))].sort();

    // Resetuj wybrany licznik jeśli nie istnieje w nowym zbiorze
    useEffect(() => {
        if (!availableSerials.includes(selectedSerial)) setSelectedSerial('');
    }, [readings, selectedYear]);

    // Przed renderowaniem wykresów
    console.log('facility:', facility);
    console.log('readings:', readings);
    console.log('selectedYear:', selectedYear);
    console.log('selectedMeterType:', selectedMeterType);
    console.log('selectedSerial:', selectedSerial);
    console.log('getAggregateChartData:', getAggregateChartData());
    console.log('getSingleMeterChartData:', getSingleMeterChartData());
    console.log('availableYears:', availableYears);
    console.log('availableSerials:', availableSerials);

    return (
        <div className="p-6 bg-ars-whitegrey mb-6">
            <Box className="p-6 bg-ars-whitegrey mb-6" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                        <Paper className="p-8" elevation={3} sx={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
                            <Typography variant="h3" className="mb-6 text-ars-deepblue" gutterBottom>
                                Panel Klienta
                            </Typography>
                            <Typography variant="h6" className="mb-4">
                                Witaj <strong>{userEmail}</strong> w panelu klienta.
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Jeśli potrzebujesz pomocy, skontaktuj się z administratorem systemu.
                            </Typography>
                        </Paper>
                    </Box>

            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
            ) : facility && (
                <Paper className="p-6 mb-6" elevation={3}>
                    <Typography variant="h6" className="mb-2 text-ars-deepblue">
                        Wykresy zużycia liczników dla: <strong>{facility.name}</strong>
                    </Typography>

                    {/* --- Wykres zbiorczy --- */}
                    <Box mb={4}>
                        <Typography variant="subtitle1" className="mb-2 font-semibold">Zbiorczy wykres zużycia liczników</Typography>
                        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                                <InputLabel id="agg-year-select-label">Rok</InputLabel>
                                <Select
                                    labelId="agg-year-select-label"
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    label="Rok"
                                >
                                    {availableYears.map(year => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" sx={{ minWidth: 180 }}>
                                <InputLabel id="meter-type-select-label">Typ licznika</InputLabel>
                                <Select
                                    labelId="meter-type-select-label"
                                    value={selectedMeterType}
                                    onChange={e => setSelectedMeterType(e.target.value)}
                                    label="Typ licznika"
                                >
                                    {COMMON_METER_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        {readings.length === 0 ? (
                            <Typography className="text-ars-darkgrey italic text-center py-8">
                                Nie znaleziono żadnych odczytów dla wybranego typu licznika w tym obiekcie.<br />
                                Skontaktuj się z administratorem lub technikiem, jeśli spodziewasz się tutaj danych.
                            </Typography>
                        ) : (
                            <Box sx={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getAggregateChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="consumption" fill="#1976d2" name="Zużycie" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </Box>

                    {/* --- Wykres pojedynczego licznika --- */}
                    <Box>
                        <Typography variant="subtitle1" className="mb-2 font-semibold">Wykres odczytu wybranego licznika</Typography>
                        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                                <InputLabel id="single-year-select-label">Rok</InputLabel>
                                <Select
                                    labelId="single-year-select-label"
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    label="Rok"
                                >
                                    {availableYears.map(year => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" sx={{ minWidth: 180 }}>
                                <InputLabel id="serial-select-label">Numer seryjny licznika</InputLabel>
                                <Select
                                    labelId="serial-select-label"
                                    value={selectedSerial}
                                    onChange={e => setSelectedSerial(e.target.value)}
                                    label="Numer seryjny licznika"
                                >
                                    <MenuItem value=""><em>Wybierz licznik</em></MenuItem>
                                    {availableSerials.map(serial => (
                                        <MenuItem key={serial} value={serial}>{serial}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        {selectedSerial ? (
                            getSingleMeterChartData().every(item => item.consumption === "0.00") ? (
                                <Typography className="text-ars-darkgrey italic text-center py-8">
                                    Brak odczytów dla wybranego licznika w tym roku.<br />
                                    Jeśli licznik jest nowy lub nie był jeszcze odczytywany, dane pojawią się po pierwszym odczycie.
                                </Typography>
                            ) : (
                                <Box sx={{ height: 300, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getSingleMeterChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="consumption" fill="#43a047" name="Odczyt" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            )
                        ) : (
                            <Typography className="text-ars-darkgrey italic text-center py-8">
                                Wybierz licznik, aby zobaczyć szczegółowe dane zużycia.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            )}
        </div>
    );
};

export default UserHomePage;