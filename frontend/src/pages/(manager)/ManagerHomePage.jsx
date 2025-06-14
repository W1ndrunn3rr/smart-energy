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

const AdminHomePage = () => {
    const userEmail = sessionManager.getUserEmail();
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [readings, setReadings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());

    // Dla wykresu zbiorczego
    const [selectedMeterType, setSelectedMeterType] = useState(COMMON_METER_TYPES[0]);
    // Dla wykresu agregacji pojedynczego licznika
    const [selectedSerialAgg, setSelectedSerialAgg] = useState('');
    // Dla wykresu odczytów pojedynczego licznika
    const [selectedSerialSingle, setSelectedSerialSingle] = useState('');

    /**
     * Pobiera listę obiektów (facilities) przypisanych do użytkownika i aktualizuje stan.
     * @function fetchFacilities
     * @returns {Promise<void>}
     */
    // Pobierz listę obiektów PRZYDZIELONYCH użytkownikowi
    useEffect(() => {
        const fetchFacilities = async () => {
            setIsLoading(true);
            try {
                // Użyj endpointu GET/facilities/user/{email}
                const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(userEmail)}`);
                if (!response.ok) throw new Error('Nie udało się pobrać listy obiektów.');
                const data = await response.json();
                console.log('fetchFacilities - response data:', data);
                setFacilities(Array.isArray(data) ? data : (data.facilities || []));
            } catch (err) {
                setError(err.message);
                setFacilities([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFacilities();
    }, [userEmail]);

    /**
     * Pobiera odczyty dla wybranego obiektu i typu licznika.
     * @function fetchReadings
     * @param {string} facilityName - Nazwa obiektu.
     * @param {string} meterType - Typ licznika.
     * @returns {Promise<void>}
     */
    // Pobierz odczyty dla wybranego obiektu
    const fetchReadings = useCallback(async (facilityName, meterType) => {
        if (!facilityName || !meterType) {
            setReadings([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/readings/${encodeURIComponent(facilityName)}/${encodeURIComponent(meterType)}`);
            if (!response.ok) throw new Error('Nie udało się pobrać odczytów.');
            const data = await response.json();
            console.log('fetchReadings - response data:', data);
            setReadings(Array.isArray(data) ? data : (data.readings || []));
        } catch (err) {
            setError(err.message);
            setReadings([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedFacility && selectedMeterType) {
            fetchReadings(selectedFacility.name, selectedMeterType);
        } else {
            setReadings([]);
        }
    }, [selectedFacility, selectedMeterType, fetchReadings]);

    // --- Agregacja do wykresu zbiorczego ---
    /**
     * Zwraca dane do wykresu zbiorczego (agregacja wszystkich liczników).
     * @function getAggregateChartData
     * @returns {Array<{month: string, consumption: string}>} Tablica danych miesięcznych.
     */
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

    // --- Agregacja do wykresu pojedynczego licznika (agregacja zużycia) ---
    /**
     * Zwraca dane do wykresu agregacji pojedynczego licznika.
     * @function getSingleMeterAggChartData
     * @returns {Array<{month: string, consumption: string}>} Tablica danych miesięcznych.
     */
    const getSingleMeterAggChartData = () => {
        if (!readings || readings.length === 0 || !selectedSerialAgg) return [];
        const filteredReadings = readings.filter(r => r.meter_serial_number === selectedSerialAgg);
        const monthlySum = Array(12).fill(0);
        const sorted = filteredReadings
            .map(r => ({ ...r, dateObj: new Date(r.reading_date) }))
            .sort((a, b) => a.dateObj - b.dateObj);
        let lastValue = null;
        let lastMonth = null;
        for (let i = 0; i < sorted.length; i++) {
            const { dateObj, value } = sorted[i];
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth();
            if (year > selectedYear) continue;
            if (lastValue === null && year === selectedYear) {
                monthlySum[month] += parseFloat(value || 0);
            } else if (lastValue !== null && year === selectedYear) {
                const diff = parseFloat(value || 0) - lastValue;
                if (diff > 0) monthlySum[month] += diff;
            }
            lastValue = parseFloat(value || 0);
            lastMonth = month;
        }
        const monthNames = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
        return monthNames.map((name, idx) => ({
            month: name,
            consumption: monthlySum[idx].toFixed(2)
        }));
    };

    // --- Odczyty pojedynczego licznika ---
    /**
     * Zwraca dane do wykresu odczytów pojedynczego licznika.
     * @function getSingleMeterChartData
     * @returns {Array<{month: string, consumption: string}>} Tablica danych miesięcznych.
     */
    const getSingleMeterChartData = () => {
        if (!readings || readings.length === 0 || !selectedSerialSingle) return [];
        const filtered = readings.filter(r =>
            new Date(r.reading_date).getFullYear() === selectedYear &&
            r.meter_serial_number === selectedSerialSingle
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
        if (!availableSerials.includes(selectedSerialAgg)) setSelectedSerialAgg('');
        if (!availableSerials.includes(selectedSerialSingle)) setSelectedSerialSingle('');
    }, [selectedFacility, readings, selectedYear]);

    // Przed renderowaniem wykresów
    console.log('selectedFacility:', selectedFacility);
    console.log('readings:', readings);
    console.log('selectedYear:', selectedYear);
    console.log('selectedMeterType:', selectedMeterType);
    console.log('selectedSerialAgg:', selectedSerialAgg);
    console.log('selectedSerialSingle:', selectedSerialSingle);
    console.log('getAggregateChartData:', getAggregateChartData());
    console.log('getSingleMeterAggChartData:', getSingleMeterAggChartData());
    console.log('getSingleMeterChartData:', getSingleMeterChartData());
    console.log('availableYears:', availableYears);
    console.log('availableSerials:', availableSerials);

    return (
        
        <div className="p-6 bg-ars-whitegrey min-h-screen">
            <Box className="bg-ars-whitegrey " display="flex" flexDirection="column" alignItems="center" justifyContent="top">
                        <Paper className="p-8" elevation={3} sx={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
                            <Typography variant="h3" className="mb-6 text-ars-deepblue" gutterBottom>
                                Panel Kierownika
                            </Typography>
                            <Typography variant="h6" className="mb-4">
                                Witaj <strong>{userEmail}</strong> w panelu kierownika.
                            </Typography>
                        </Paper>
                    </Box>
            <div className="flex items-center justify-center ">
  <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">
    Wybierz obiekt do wykreślenia wykresów
  </h1>
</div>
<div className="flex items-center justify-center ">
            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            <FormControl className="mb-6" disabled={isLoading || facilities.length === 0}>
                <InputLabel id="facility-select-label">Wybierz obiekt</InputLabel>
                <Select
                    labelId="facility-select-label"
                    value={selectedFacility ? selectedFacility.name : ''}
                    onChange={e => {
                        const facility = facilities.find(f => f.name === e.target.value);
                        setSelectedFacility(facility || null);
                    }}
                    label="Wybierz obiekt"
                    sx={{ minWidth: 300 }}
                >
                    {facilities.map(facility => (
                        <MenuItem key={facility.name} value={facility.name}>{facility.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
</div>
            {selectedFacility && (
                <Paper className="p-6 mb-6" elevation={3}>
                    <Typography variant="h6" className="mb-2 text-ars-deepblue">
                        Wykresy zużycia liczników dla: <strong>{selectedFacility.name}</strong>
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
                        {isLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
                        ) : readings.length === 0 ? (
                            <Typography className="text-ars-darkgrey italic text-center py-8">
                                <span style={{ fontWeight: 500, fontSize: '1.1em' }}>Brak danych do wyświetlenia</span>
                                <br />
                                Nie znaleziono żadnych odczytów dla wybranego typu licznika w tym obiekcie.<br />
                                Jeśli spodziewasz się tutaj danych, skontaktuj się z administratorem lub technikiem.
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

                    {/* --- Wykres zużycia dla wybranego licznika (agregacja jak wykres zbiorczy, ale tylko jeden licznik) --- */}
                    <Box mb={4}>
    <Typography variant="subtitle1" className="mb-2 font-semibold">
        Wykres zużycia wybranego licznika (agregacja miesięczna)
    </Typography>
    <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <FormControl variant="outlined" sx={{ minWidth: 180 }}>
            <InputLabel id="agg-serial-select-label">Numer seryjny licznika</InputLabel>
            <Select
                labelId="agg-serial-select-label"
                value={selectedSerialAgg}
                onChange={e => setSelectedSerialAgg(e.target.value)}
                label="Numer seryjny licznika"
            >
                <MenuItem value=""><em>Wybierz licznik</em></MenuItem>
                {availableSerials.map(serial => (
                    <MenuItem key={serial} value={serial}>{serial}</MenuItem>
                ))}
            </Select>
        </FormControl>
    </Box>
    {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
    ) : selectedSerialAgg ? (
        getSingleMeterAggChartData().every(item => item.consumption === "0.00") ? (
            <Typography className="text-ars-darkgrey italic text-center py-8">
                <span style={{ fontWeight: 500, fontSize: '1.1em' }}>Brak danych dla wybranego licznika</span>
                <br />
                W tym roku nie znaleziono żadnych odczytów dla wybranego licznika.<br />
                Jeśli licznik jest nowy lub nie był jeszcze odczytywany, dane pojawią się po pierwszym odczycie.
            </Typography>
        ) : (
            <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSingleMeterAggChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="consumption" fill="#ffa726" name="Zużycie (agregacja)" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        )
    ) : (
        <Typography className="text-ars-darkgrey italic text-center py-8">
            <span style={{ fontWeight: 500, fontSize: '1.1em' }}>Wybierz licznik</span>
            <br />
            Wybierz licznik z listy, aby zobaczyć szczegółowe dane zużycia.
        </Typography>
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
                                    value={selectedSerialSingle}
                                    onChange={e => setSelectedSerialSingle(e.target.value)}
                                    label="Numer seryjny licznika"
                                >
                                    <MenuItem value=""><em>Wybierz licznik</em></MenuItem>
                                    {availableSerials.map(serial => (
                                        <MenuItem key={serial} value={serial}>{serial}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        {isLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
                        ) : selectedSerialSingle ? (
                            getSingleMeterChartData().every(item => item.consumption === "0.00") ? (
                                <Typography className="text-ars-darkgrey italic text-center py-8">
                                    <span style={{ fontWeight: 500, fontSize: '1.1em' }}>Brak danych dla wybranego licznika</span>
                                    <br />
                                    W tym roku nie znaleziono żadnych odczytów dla wybranego licznika.<br />
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
                                <span style={{ fontWeight: 500, fontSize: '1.1em' }}>Wybierz licznik</span>
                                <br />
                                Wybierz licznik z listy, aby zobaczyć szczegółowe dane odczytu.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            )}
        </div>
    );
};

export default AdminHomePage;