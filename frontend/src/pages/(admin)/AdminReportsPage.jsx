import React, { useState, useEffect } from 'react';
import { Box, Button, MenuItem, FormControl, InputLabel, Select, CircularProgress, Alert } from '@mui/material';
import { API_URL } from '../../definitions';
import { sessionManager } from '../../scripts/session_manager';
import { saveAs } from 'file-saver'; // Dodaj do package.json: npm install file-saver

const AdminReportsPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        /**
         * Pobiera listę obiektów (facilities) przypisanych do użytkownika i aktualizuje stan.
         * @function fetchFacilities
         * @returns {Promise<void>}
         */
        const fetchFacilities = async () => {
            setIsLoading(true);
            setError('');
            try {
                const email = sessionManager.getUserEmail();
                if (!email) throw new Error('Nie znaleziono emaila użytkownika.');
                const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(email)}`);
                if (!response.ok) throw new Error('Nie udało się pobrać listy obiektów.');
                const data = await response.json();
                // Najczęstszy błąd: API zwraca { facilities: [...] }
                const facilitiesArray = Array.isArray(data) ? data : (data.facilities || []);
                setFacilities(facilitiesArray);
                console.log('Pobrane facilities:', facilitiesArray);
            } catch (err) {
                setError(err.message);
                setFacilities([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    // Funkcja pomocnicza do generowania CSV
    /**
     * Generuje i pobiera raport CSV dla liczników energii elektrycznej.
     * @function generateElectricityReport
     * @returns {Promise<void>}
     */
    const generateElectricityReport = async () => {
        if (!selectedFacility) return;
        setIsLoading(true);
        setError('');
        try {
            let facilitiesToReport = [];
            if (selectedFacility === "__ALL__") {
                facilitiesToReport = facilities;
            } else {
                facilitiesToReport = facilities.filter(f => f.name === selectedFacility);
            }
            let allRows = [];
            for (const facility of facilitiesToReport) {
                // 1. Pobierz liczniki
                let meters = [];
                try {
                    const metersRes = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
                    if (!metersRes.ok) throw new Error();
                    const metersData = await metersRes.json();
                    meters = Array.isArray(metersData) ? metersData : (metersData.meters || []);
                } catch {
                    meters = [];
                }
                const electricityMeters = meters.filter(m => m.meter_type === 'Energia elektryczna');

                // 2. Pobierz odczyty
                let readings = [];
                try {
                    const readingsRes = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}/Energia elektryczna`);
                    if (!readingsRes.ok) throw new Error();
                    const readingsData = await readingsRes.json();
                    readings = Array.isArray(readingsData) ? readingsData : (readingsData.readings || []);
                } catch {
                    readings = [];
                }

                // 3. Przygotuj dane CSV dla tego obiektu
                const rows = electricityMeters.map(meter => {
                    const meterReadings = [];
                    let prevValue = null;

                    // Grudzień 2024
                    const grudzien24 = readings.find(r =>
                        r.meter_serial_number === meter.serial_number &&
                        new Date(r.reading_date).getMonth() === 11 &&
                        new Date(r.reading_date).getFullYear() === 2024
                    );
                    meterReadings.push(grudzien24 ? grudzien24.value : '-');
                    prevValue = grudzien24 ? parseFloat(grudzien24.value) : null;

                    // Styczeń-grudzień 2025
                    let prevMonthValue = prevValue;
                    for (let m = 0; m < 12; m++) {
                        const reading = readings.find(r =>
                            r.meter_serial_number === meter.serial_number &&
                            new Date(r.reading_date).getMonth() === m &&
                            new Date(r.reading_date).getFullYear() === 2025
                        );
                        const value = reading ? parseFloat(reading.value) : '';
                        meterReadings.push(value !== '' ? value.toLocaleString('pl-PL') : '-');
                        // Zużycie
                        let usage = '-';
                        if (value !== '' && prevMonthValue !== null && value !== '') {
                            usage = (value - prevMonthValue).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        meterReadings.push(usage);
                        prevMonthValue = value !== '' ? value : prevMonthValue;
                    }

                    return [
                        facility.name || '-',
                        meter.serial_number || '-',
                        meter.ppe || '-',
                        meter.unit || 'kWh',
                        meter.multiply_factor !== undefined && meter.multiply_factor !== null ? meter.multiply_factor : '-',
                        ...meterReadings
                    ];
                });

                allRows = allRows.concat(rows);
            }

            // 4. Przygotuj nagłówki CSV (tylko raz)
            const months = [
                'Grudzien \'24', 'styczen', 'luty', 'marzec', 'kwiecien', 'maj', 'czerwiec',
                'lipiec', 'sierpien', 'wrzesien', 'pazdziernik', 'listopad', 'grudzien'
            ];
            const header = [
                'Lokal', 'nr licznika', 'PPE', 'jednostka', 'mnozna',
                ...months.flatMap(m => [m, 'zuzycie'])
            ];

            // 5. SUMA zużyć
            // Indeksy kolumn zużycia: 5,7,9,...,29 (licząc od 0)
            const zuzycieIndexes = [];
            let col = 5;
            for (let i = 0; i < 13; i++) {
                zuzycieIndexes.push(col + 1); // bo po każdej wartości jest kolumna zużycia
                col += 2;
            }
            const sumZuzycie = Array(13).fill(0);
            allRows.forEach(row => {
                zuzycieIndexes.forEach((idx, i) => {
                    const val = row[idx];
                    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
                    if (!isNaN(num)) sumZuzycie[i] += num;
                });
            });
            const sumRow = [
                'SUMA', '', '', '', '',
                ...months.flatMap((_, i) => ['', sumZuzycie[i] !== 0 ? sumZuzycie[i].toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'])
            ];

            // 6. Zbuduj CSV
            const csvContent = [
                header.join(';'),
                ...allRows.map(row => row.join(';')),
                sumRow.join(';')
            ].join('\r\n');

            // 7. Pobierz plik
            const filename = selectedFacility === "__ALL__"
                ? `Raport_Energia_Elektryczna_Wszystkie_obiekty.csv`
                : `Raport_Energia_Elektryczna_${selectedFacility}.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError('Błąd generowania raportu: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    // Funkcja pomocnicza do generowania CSV dla liczników Energii Klimatyzacji
    /**
     * Generuje i pobiera raport CSV dla liczników energii klimatyzacji.
     * @function generateAirConditioningReport
     * @returns {Promise<void>}
     */
    const generateAirConditioningReport = async () => {
        if (!selectedFacility) return;
        setIsLoading(true);
        setError('');
        try {
            let facilitiesToReport = [];
            if (selectedFacility === "__ALL__") {
                facilitiesToReport = facilities;
            } else {
                facilitiesToReport = facilities.filter(f => f.name === selectedFacility);
            }
            let allRows = [];
            for (const facility of facilitiesToReport) {
                // 1. Pobierz liczniki
                let meters = [];
                try {
                    const metersRes = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
                    if (!metersRes.ok) throw new Error();
                    const metersData = await metersRes.json();
                    meters = Array.isArray(metersData) ? metersData : (metersData.meters || []);
                } catch {
                    meters = [];
                }
                const acMeters = meters.filter(m => m.meter_type === 'Energia klimatyzacja');

                // 2. Pobierz odczyty
                let readings = [];
                try {
                    const readingsRes = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}/Energia klimatyzacja`);
                    if (!readingsRes.ok) throw new Error();
                    const readingsData = await readingsRes.json();
                    readings = Array.isArray(readingsData) ? readingsData : (readingsData.readings || []);
                } catch {
                    readings = [];
                }

                // 3. Przygotuj dane CSV dla tego obiektu
                const rows = acMeters.map(meter => {
                    const meterReadings = [];
                    let prevValue = null;

                    // Grudzień 2024
                    const grudzien24 = readings.find(r =>
                        r.meter_serial_number === meter.serial_number &&
                        new Date(r.reading_date).getMonth() === 11 &&
                        new Date(r.reading_date).getFullYear() === 2024
                    );
                    meterReadings.push(grudzien24 ? grudzien24.value : '-');
                    prevValue = grudzien24 ? parseFloat(grudzien24.value) : null;

                    // Styczeń-grudzień 2025
                    let prevMonthValue = prevValue;
                    for (let m = 0; m < 12; m++) {
                        const reading = readings.find(r =>
                            r.meter_serial_number === meter.serial_number &&
                            new Date(r.reading_date).getMonth() === m &&
                            new Date(r.reading_date).getFullYear() === 2025
                        );
                        const value = reading ? parseFloat(reading.value) : '';
                        meterReadings.push(value !== '' ? value.toLocaleString('pl-PL') : '-');
                        // Zużycie
                        let usage = '-';
                        if (value !== '' && prevMonthValue !== null && value !== '') {
                            usage = (value - prevMonthValue).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        meterReadings.push(usage);
                        prevMonthValue = value !== '' ? value : prevMonthValue;
                    }

                    return [
                        facility.name || '-',
                        meter.serial_number || '-',
                        meter.ppe || '-',
                        meter.unit || 'kWh',
                        meter.multiply_factor !== undefined && meter.multiply_factor !== null ? meter.multiply_factor : '-',
                        ...meterReadings
                    ];
                });

                allRows = allRows.concat(rows);
            }

            // 4. Przygotuj nagłówki CSV (tylko raz)
            const months = [
                'Grudzien \'24', 'styczen', 'luty', 'marzec', 'kwiecien', 'maj', 'czerwiec',
                'lipiec', 'sierpien', 'wrzesien', 'pazdziernik', 'listopad', 'grudzien'
            ];
            const header = [
                'Lokal', 'nr licznika', 'PPE', 'jednostka', 'mnozna',
                ...months.flatMap(m => [m, 'zuzycie'])
            ];

            // 5. SUMA zużyć
            const zuzycieIndexes = [];
            let col = 5;
            for (let i = 0; i < 13; i++) {
                zuzycieIndexes.push(col + 1);
                col += 2;
            }
            const sumZuzycie = Array(13).fill(0);
            allRows.forEach(row => {
                zuzycieIndexes.forEach((idx, i) => {
                    const val = row[idx];
                    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
                    if (!isNaN(num)) sumZuzycie[i] += num;
                });
            });
            const sumRow = [
                'SUMA', '', '', '', '',
                ...months.flatMap((_, i) => ['', sumZuzycie[i] !== 0 ? sumZuzycie[i].toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'])
            ];

            // 6. Zbuduj CSV
            const csvContent = [
                header.join(';'),
                ...allRows.map(row => row.join(';')),
                sumRow.join(';')
            ].join('\r\n');

            // 7. Pobierz plik
            const filename = selectedFacility === "__ALL__"
                ? `Raport_Energia_Klimatyzacja_Wszystkie_obiekty.csv`
                : `Raport_Energia_Klimatyzacja_${selectedFacility}.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError('Błąd generowania raportu: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    // Funkcja pomocnicza do generowania CSV dla liczników Wody zimnej i Wody ciepłej
    /**
     * Generuje i pobiera raport CSV dla liczników wody zimnej i ciepłej.
     * @function generateWaterReport
     * @returns {Promise<void>}
     */
    const generateWaterReport = async () => {
        if (!selectedFacility) return;
        setIsLoading(true);
        setError('');
        try {
            let facilitiesToReport = [];
            if (selectedFacility === "__ALL__") {
                facilitiesToReport = facilities;
            } else {
                facilitiesToReport = facilities.filter(f => f.name === selectedFacility);
            }
            let allRows = [];

            // Typy liczników do raportu
            const waterTypes = ['Woda zimna', 'Woda ciepła'];

            for (const facility of facilitiesToReport) {
                // 1. Pobierz liczniki
                let meters = [];
                try {
                    const metersRes = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
                    if (!metersRes.ok) throw new Error();
                    const metersData = await metersRes.json();
                    meters = Array.isArray(metersData) ? metersData : (metersData.meters || []);
                } catch {
                    meters = [];
                }
                const waterMeters = meters.filter(m => waterTypes.includes(m.meter_type));

                // 2. Pobierz odczyty dla obu typów
                let allReadings = [];
                for (const type of waterTypes) {
                    try {
                        const readingsRes = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}/${encodeURIComponent(type)}`);
                        if (!readingsRes.ok) throw new Error();
                        const readingsData = await readingsRes.json();
                        const readings = Array.isArray(readingsData) ? readingsData : (readingsData.readings || []);
                        allReadings = allReadings.concat(readings);
                    } catch {
                        // Brak odczytów dla tego typu
                    }
                }

                // 3. Przygotuj dane CSV dla tego obiektu
                const rows = waterMeters.map(meter => {
                    const meterReadings = [];
                    let prevValue = null;

                    // Grudzień 2024
                    const grudzien24 = allReadings.find(r =>
                        r.meter_serial_number === meter.serial_number &&
                        new Date(r.reading_date).getMonth() === 11 &&
                        new Date(r.reading_date).getFullYear() === 2024
                    );
                    meterReadings.push(grudzien24 ? grudzien24.value : '-');
                    prevValue = grudzien24 ? parseFloat(grudzien24.value) : null;

                    // Styczeń-grudzień 2025
                    let prevMonthValue = prevValue;
                    for (let m = 0; m < 12; m++) {
                        const reading = allReadings.find(r =>
                            r.meter_serial_number === meter.serial_number &&
                            new Date(r.reading_date).getMonth() === m &&
                            new Date(r.reading_date).getFullYear() === 2025
                        );
                        const value = reading ? parseFloat(reading.value) : '';
                        meterReadings.push(value !== '' ? value.toLocaleString('pl-PL') : '-');
                        // Zużycie
                        let usage = '-';
                        if (value !== '' && prevMonthValue !== null && value !== '') {
                            usage = (value - prevMonthValue).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        meterReadings.push(usage);
                        prevMonthValue = value !== '' ? value : prevMonthValue;
                    }

                    return [
                        facility.name || '-',
                        meter.serial_number || '-',
                        meter.ppe || '-',
                        meter.unit || 'm3',
                        meter.multiply_factor !== undefined && meter.multiply_factor !== null ? meter.multiply_factor : '-',
                        ...meterReadings
                    ];
                });

                allRows = allRows.concat(rows);
            }

            // 4. Przygotuj nagłówki CSV (tylko raz)
            const months = [
                'Grudzien \'24', 'styczen', 'luty', 'marzec', 'kwiecien', 'maj', 'czerwiec',
                'lipiec', 'sierpien', 'wrzesien', 'pazdziernik', 'listopad', 'grudzien'
            ];
            const header = [
                'Lokal', 'nr licznika', 'PPE', 'jednostka', 'mnozna',
                ...months.flatMap(m => [m, 'zuzycie'])
            ];

            // 5. SUMA zużyć
            const zuzycieIndexes = [];
            let col = 5;
            for (let i = 0; i < 13; i++) {
                zuzycieIndexes.push(col + 1);
                col += 2;
            }
            const sumZuzycie = Array(13).fill(0);
            allRows.forEach(row => {
                zuzycieIndexes.forEach((idx, i) => {
                    const val = row[idx];
                    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
                    if (!isNaN(num)) sumZuzycie[i] += num;
                });
            });
            const sumRow = [
                'SUMA', '', '', '', '',
                ...months.flatMap((_, i) => ['', sumZuzycie[i] !== 0 ? sumZuzycie[i].toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'])
            ];

            // 6. Zbuduj CSV
            const csvContent = [
                header.join(';'),
                ...allRows.map(row => row.join(';')),
                sumRow.join(';')
            ].join('\r\n');

            // 7. Pobierz plik
            const filename = selectedFacility === "__ALL__"
                ? `Raport_Woda_Wszystkie_obiekty.csv`
                : `Raport_Woda_${selectedFacility}.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError('Błąd generowania raportu: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    // Funkcja pomocnicza do generowania CSV dla liczników ciepła
    /**
     * Generuje i pobiera raport CSV dla liczników ciepła.
     * @function generateHeatMeterReport
     * @returns {Promise<void>}
     */
    const generateHeatMeterReport = async () => {
        if (!selectedFacility) return;
        setIsLoading(true);
        setError('');
        try {
            let facilitiesToReport = [];
            if (selectedFacility === "__ALL__") {
                facilitiesToReport = facilities;
            } else {
                facilitiesToReport = facilities.filter(f => f.name === selectedFacility);
            }
            let allRows = [];

            // Typ liczników do raportu
            const heatType = 'Licznik ciepła';

            for (const facility of facilitiesToReport) {
                // 1. Pobierz liczniki
                let meters = [];
                try {
                    const metersRes = await fetch(`${API_URL}/meters/${encodeURIComponent(facility.name)}`);
                    if (!metersRes.ok) throw new Error();
                    const metersData = await metersRes.json();
                    meters = Array.isArray(metersData) ? metersData : (metersData.meters || []);
                } catch {
                    meters = [];
                }
                const heatMeters = meters.filter(m => m.meter_type === heatType);

                // 2. Pobierz odczyty
                let readings = [];
                try {
                    const readingsRes = await fetch(`${API_URL}/readings/${encodeURIComponent(facility.name)}/${encodeURIComponent(heatType)}`);
                    if (!readingsRes.ok) throw new Error();
                    const readingsData = await readingsRes.json();
                    readings = Array.isArray(readingsData) ? readingsData : (readingsData.readings || []);
                } catch {
                    readings = [];
                }

                // 3. Przygotuj dane CSV dla tego obiektu
                const rows = heatMeters.map(meter => {
                    const meterReadings = [];
                    let prevValue = null;

                    // Grudzień 2024
                    const grudzien24 = readings.find(r =>
                        r.meter_serial_number === meter.serial_number &&
                        new Date(r.reading_date).getMonth() === 11 &&
                        new Date(r.reading_date).getFullYear() === 2024
                    );
                    meterReadings.push(grudzien24 ? grudzien24.value : '-');
                    prevValue = grudzien24 ? parseFloat(grudzien24.value) : null;

                    // Styczeń-grudzień 2025
                    let prevMonthValue = prevValue;
                    for (let m = 0; m < 12; m++) {
                        const reading = readings.find(r =>
                            r.meter_serial_number === meter.serial_number &&
                            new Date(r.reading_date).getMonth() === m &&
                            new Date(r.reading_date).getFullYear() === 2025
                        );
                        const value = reading ? parseFloat(reading.value) : '';
                        meterReadings.push(value !== '' ? value.toLocaleString('pl-PL') : '-');
                        // Zużycie
                        let usage = '-';
                        if (value !== '' && prevMonthValue !== null && value !== '') {
                            usage = (value - prevMonthValue).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        meterReadings.push(usage);
                        prevMonthValue = value !== '' ? value : prevMonthValue;
                    }

                    return [
                        facility.name || '-',
                        meter.serial_number || '-',
                        meter.ppe || '-',
                        meter.unit || 'GJ',
                        meter.multiply_factor !== undefined && meter.multiply_factor !== null ? meter.multiply_factor : '-',
                        ...meterReadings
                    ];
                });

                allRows = allRows.concat(rows);
            }

            // 4. Przygotuj nagłówki CSV (tylko raz)
            const months = [
                'Grudzien \'24', 'styczen', 'luty', 'marzec', 'kwiecien', 'maj', 'czerwiec',
                'lipiec', 'sierpien', 'wrzesien', 'pazdziernik', 'listopad', 'grudzien'
            ];
            const header = [
                'Lokal', 'nr licznika', 'PPE', 'jednostka', 'mnozna',
                ...months.flatMap(m => [m, 'zuzycie'])
            ];

            // 5. SUMA zużyć
            const zuzycieIndexes = [];
            let col = 5;
            for (let i = 0; i < 13; i++) {
                zuzycieIndexes.push(col + 1);
                col += 2;
            }
            const sumZuzycie = Array(13).fill(0);
            allRows.forEach(row => {
                zuzycieIndexes.forEach((idx, i) => {
                    const val = row[idx];
                    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
                    if (!isNaN(num)) sumZuzycie[i] += num;
                });
            });
            const sumRow = [
                'SUMA', '', '', '', '',
                ...months.flatMap((_, i) => ['', sumZuzycie[i] !== 0 ? sumZuzycie[i].toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'])
            ];

            // 6. Zbuduj CSV
            const csvContent = [
                header.join(';'),
                ...allRows.map(row => row.join(';')),
                sumRow.join(';')
            ].join('\r\n');

            // 7. Pobierz plik
            const filename = selectedFacility === "__ALL__"
                ? `Raport_Licznik_Ciepla_Wszystkie_obiekty.csv`
                : `Raport_Licznik_Ciepla_${selectedFacility}.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError('Błąd generowania raportu: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Raporty</h1>
            {error && <Alert severity="error" className="mb-4">{error}</Alert>}
            <p className="text-ars-darkgrey mb-4">Ta sekcja będzie służyć do generowania i przeglądania raportów administracyjnych.</p>
            <FormControl variant="outlined" sx={{ minWidth: 320, mb: 4 }} disabled={isLoading || facilities.length === 0}>
                <InputLabel id="facility-select-label">Wybierz obiekt</InputLabel>
                <Select
                    labelId="facility-select-label"
                    value={selectedFacility}
                    onChange={e => setSelectedFacility(e.target.value)}
                    label="Wybierz obiekt"
                >
                    <MenuItem value="__ALL__">Wszystkie obiekty</MenuItem>
                    {facilities.map(facility => (
                        <MenuItem key={facility.name} value={facility.name}>{facility.name}</MenuItem>
                    ))}
                </Select>
                {isLoading && <CircularProgress size={24} sx={{ position: 'absolute', right: 16, top: 16 }} />}
            </FormControl>

            {selectedFacility && (
                <Box display="flex" flexDirection="row" gap={2} mt={2} flexWrap="wrap">
                    <Button variant="contained" color="primary" onClick={generateElectricityReport} disabled={isLoading}>
                        Wygeneruj raport dla liczników Energii Elektrycznej
                    </Button>
                    <Button variant="contained" color="primary" onClick={generateAirConditioningReport} disabled={isLoading}>
                        Wygeneruj raport dla liczników Energii Klimatyzacji
                    </Button>
                    <Button variant="contained" color="primary" onClick={generateWaterReport} disabled={isLoading}>
                        Wygeneruj raport dla liczników Wody zimnej i Wody ciepłej
                    </Button>
                    <Button variant="contained" color="primary" onClick={generateHeatMeterReport} disabled={isLoading}>
                        Wygeneruj raport dla liczników Liczniki ciepła
                    </Button>
                </Box>
            )}

            <p className="mt-4 text-sm text-gray-600">W przyszłości można tu zintegrować narzędzia do wizualizacji danych i konfiguracji raportów.</p>
        </div>
    );
};

export default AdminReportsPage;