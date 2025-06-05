import React, { useState, useEffect, useCallback } from 'react';
import {
    Button, TextField, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, CircularProgress, Alert, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography,
    Select, MenuItem, FormControl, InputLabel, Autocomplete, Collapse // Dodano Collapse
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon, // Ikona do rozwijania
    KeyboardArrowUp as KeyboardArrowUpIcon      // Ikona do zwijania
} from '@mui/icons-material';
import { API_URL } from '../../definitions';
import { sessionManager } from '../../scripts/session_manager';

const COMMON_METER_TYPES = ['Energia elektryczna', 'Energia klimatyzacja', 'Woda zimna', 'Woda ciepła', 'Licznik ciepła'];

const getUnitForMeterType = (meterType) => {
    switch (meterType) {
        case 'Energia elektryczna':
        case 'Energia klimatyzacja':
            return 'kWh';
        case 'Woda zimna':
        case 'Woda ciepła':
            return 'm³';
        case 'Licznik ciepła':
            return 'GJ';
        default:
            return '';
    }
};

const TechnicianDataEntryPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [meters, setMeters] = useState([]);
    const [readings, setReadings] = useState([]);
    const [currentUserEmail, setCurrentUserEmail] = useState('');

    const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
    const [isLoadingMeters, setIsLoadingMeters] = useState(false);
    const [isLoadingReadings, setIsLoadingReadings] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Dialog states
    const [openAddReadingDialog, setOpenAddReadingDialog] = useState(false);
    const [currentMeterForDialog, setCurrentMeterForDialog] = useState(null);
    const [newReadingValue, setNewReadingValue] = useState('');
    const [newReadingIdInput, setNewReadingIdInput] = useState(''); // <-- DODANO: Stan dla ID nowego odczytu

    const [openEditReadingDialog, setOpenEditReadingDialog] = useState(false);
    const [readingToEdit, setReadingToEdit] = useState(null);
    const [editedReadingValue, setEditedReadingValue] = useState('');

    const [openDeleteReadingDialog, setOpenDeleteReadingDialog] = useState(false);
    const [readingToDelete, setReadingToDelete] = useState(null);

    const [openConfirmSaveDialog, setOpenConfirmSaveDialog] = useState(false);
    const [pendingSaveAction, setPendingSaveAction] = useState(null);

    // Nowe stany dla filtrowania i zwijania
    const [selectedMeterTypeFilter, setSelectedMeterTypeFilter] = useState(''); // '' oznacza wszystkie typy
    const [meterSearchQuery, setMeterSearchQuery] = useState('');
    const [expandedReadings, setExpandedReadings] = useState({}); // np. { 'serial_numer_1': true, 'serial_numer_2': false }


    useEffect(() => {
        const email = sessionManager.getUserEmail();
        if (email) {
            setCurrentUserEmail(email);
        } else {
            setError("Nie udało się zidentyfikować użytkownika. Zaloguj się ponownie.");
        }
    }, []);

    const fetchFacilities = useCallback(async () => {
        setIsLoadingFacilities(true);
        try {
            // Zmieniono endpoint na GET/facilities/user/{email}
            if (!currentUserEmail) {
                setFacilities([]);
                setIsLoadingFacilities(false);
                return;
            }
            const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(currentUserEmail)}`);
            if (!response.ok) throw new Error('Nie udało się pobrać listy obiektów.');
            const data = await response.json();
            setFacilities(Array.isArray(data) ? data : (data.facilities || []));
        } catch (err) {
            setError(err.message);
            setFacilities([]);
        } finally {
            setIsLoadingFacilities(false);
        }
    }, [currentUserEmail]);

    useEffect(() => {
        if (currentUserEmail) {
            fetchFacilities();
        }
    }, [fetchFacilities, currentUserEmail]);

    const fetchMetersForFacility = useCallback(async (facilityName) => {
        if (!facilityName) {
            setMeters([]);
            return;
        }
        setIsLoadingMeters(true);
        try {
            const response = await fetch(`${API_URL}/meters/${encodeURIComponent(facilityName)}`);
            if (!response.ok) throw new Error(`Nie udało się pobrać liczników dla obiektu ${facilityName}.`);
            const data = await response.json();
            setMeters(Array.isArray(data) ? data : (data.meters || []));
        } catch (err) {
            setError(err.message);
            setMeters([]);
        } finally {
            setIsLoadingMeters(false);
        }
    }, []);

    const fetchReadingsForFacility = useCallback(async (facilityName) => {
        if (!facilityName) {
            setReadings([]);
            return;
        }
        setIsLoadingReadings(true);
        try {
            const response = await fetch(`${API_URL}/readings/${encodeURIComponent(facilityName)}`, {
                cache: 'no-store'
            });
            if (!response.ok) throw new Error(`Nie udało się pobrać odczytów dla obiektu ${facilityName}.`);
            const data = await response.json();
            const readingsArray = Array.isArray(data) ? data : (data && Array.isArray(data.readings) ? data.readings : []);
            setReadings(readingsArray);
        } catch (err) {
            setError(err.message);
            setReadings([]);
        } finally {
            setIsLoadingReadings(false);
        }
    }, []);

    useEffect(() => {
        if (selectedFacility) {
            setError('');
            setSuccessMessage('');
            fetchMetersForFacility(selectedFacility.name);
            fetchReadingsForFacility(selectedFacility.name);
            setExpandedReadings({}); // Resetuj stan rozwinięcia przy zmianie obiektu
        } else {
            setMeters([]);
            setReadings([]);
        }
    }, [selectedFacility, fetchMetersForFacility, fetchReadingsForFacility]);

    const handleOpenAddReadingDialog = (meter) => {
        if (!currentUserEmail) {
            setError("Email użytkownika nie jest dostępny. Nie można dodać odczytu.");
            return;
        }
        setCurrentMeterForDialog(meter);
        setNewReadingValue('');
        setNewReadingIdInput(''); // <-- DODANO: Resetuj pole ID odczytu
        setError('');
        setOpenAddReadingDialog(true);
    };

    const confirmAndCreateReading = () => {
        if (!currentMeterForDialog || !newReadingValue.trim() || !selectedFacility || !newReadingIdInput.trim()) { // <-- ZMODYFIKOWANO: Walidacja dla newReadingIdInput
            setError("Numer seryjny odczytu (ID) oraz wartość odczytu są wymagane."); // Komunikat błędu w dialogu
            return;
        }
        const parsedReadingId = parseInt(newReadingIdInput, 10);
        if (isNaN(parsedReadingId)) {
            setError("Numer seryjny odczytu (ID) musi być liczbą całkowitą."); // Komunikat błędu w dialogu
            return;
        }

        setPendingSaveAction(() => async () => {
            setIsSubmitting(true);
            setError('');
            setSuccessMessage('');
            const readingData = {
                reading_id: parsedReadingId, // <-- DODANO: Użyj sparsowanego ID odczytu
                meter_serial_number: currentMeterForDialog.serial_number,
                email: currentUserEmail,
                value: parseFloat(newReadingValue),
                reading_date: new Date().toISOString().split('T')[0],
            };
            try {
                const response = await fetch(`${API_URL}/create_reading`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(readingData),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Nie udało się zapisać odczytu.');
                }
                setSuccessMessage('Odczyt został pomyślnie zapisany.');
                fetchReadingsForFacility(selectedFacility.name);
                setOpenAddReadingDialog(false);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsSubmitting(false);
                setOpenConfirmSaveDialog(false);
                setPendingSaveAction(null);
            }
        });
        setOpenConfirmSaveDialog(true);
    };

    const handleOpenEditReadingDialog = (reading, meterType) => {
        setReadingToEdit({ ...reading, meter_type: meterType });
        setEditedReadingValue(reading.value.toString());
        setError('');
        setOpenEditReadingDialog(true);
    };

    const confirmAndUpdateReading = () => {
        if (!readingToEdit || !editedReadingValue.trim() || !selectedFacility) {
            setError("Wartość odczytu jest wymagana.");
            return;
        }

        // Dodano sprawdzenie istnienia reading_id, analogicznie do AdminMetersPage
        if (readingToEdit.reading_id === undefined || readingToEdit.reading_id === null) {
            setError("Brak ID odczytu. Nie można zaktualizować.");
            console.error("confirmAndUpdateReading: reading_id is missing in readingToEdit", readingToEdit);
            return;
        }

        setPendingSaveAction(() => async () => {
            setIsSubmitting(true);
            setError('');
            setSuccessMessage('');

            // Zaktualizowano payload, aby był spójny z AdminMetersPage i wysyłał reading_id
            const updatePayload = {
                reading_id: readingToEdit.reading_id, // Kluczowy identyfikator odczytu
                value: parseFloat(editedReadingValue),
                reading_date: new Date(readingToEdit.reading_date).toISOString().split('T')[0], // Data odczytu (zazwyczaj nieedytowalna, ale wysyłana dla kontekstu)
                meter_serial_number: readingToEdit.meter_serial_number, // Numer seryjny licznika dla kontekstu
                email: readingToEdit.email, // Email użytkownika, który pierwotnie zarejestrował odczyt (zakładając, że readingToEdit.email istnieje)
                // Usunięto facility_name, jeśli API /update_reading go nie wymaga przy podaniu reading_id
            };

            try {
                const response = await fetch(`${API_URL}/update_reading`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Nie udało się zaktualizować odczytu.');
                }
                setSuccessMessage('Odczyt został pomyślnie zaktualizowany.');
                fetchReadingsForFacility(selectedFacility.name);
                setOpenEditReadingDialog(false);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsSubmitting(false);
                setOpenConfirmSaveDialog(false);
                setPendingSaveAction(null);
            }
        });
        setOpenConfirmSaveDialog(true);
    };

    const handleOpenDeleteReadingDialog = (reading) => {
        setReadingToDelete(reading);
        setError('');
        setOpenDeleteReadingDialog(true);
    };

    const confirmAndDeleteReading = async () => {
        if (!readingToDelete || !selectedFacility) {
            setError("Nie można usunąć odczytu. Brakujące dane."); // Ustawienie błędu, jeśli brakuje danych
            return;
        }

        // Dodano sprawdzenie istnienia reading_id, analogicznie do AdminMetersPage
        if (readingToDelete.reading_id === undefined || readingToDelete.reading_id === null) {
            setError("Brak ID odczytu. Nie można usunąć.");
            console.error("confirmAndDeleteReading: reading_id is missing in readingToDelete", readingToDelete);
            setOpenDeleteReadingDialog(false); // Zamknij dialog, jeśli ID brakuje
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
        try {
            // Zmieniono endpoint i usunięto body, analogicznie do AdminMetersPage
            const response = await fetch(`${API_URL}/delete_reading/${readingToDelete.reading_id}`, {
                method: 'DELETE',
                headers: {
                    // 'Content-Type': 'application/json', // Zwykle niepotrzebne dla DELETE bez body
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się usunąć odczytu lub sparsować błędu.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Odczyt (ID: ${readingToDelete.reading_id}) został pomyślnie usunięty.`);
            fetchReadingsForFacility(selectedFacility.name);
            setOpenDeleteReadingDialog(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const executePendingSave = () => {
        if (pendingSaveAction) {
            pendingSaveAction();
        }
    };

    const toggleReadingsExpansion = (meterSerialNumber) => {
        setExpandedReadings(prev => ({
            ...prev,
            [meterSerialNumber]: !prev[meterSerialNumber]
        }));
    };

    const getFilteredAndSearchedMeters = () => {
        let filtered = meters;
        if (selectedMeterTypeFilter) {
            filtered = filtered.filter(meter => meter.meter_type === selectedMeterTypeFilter);
        }
        if (meterSearchQuery) {
            filtered = filtered.filter(meter =>
                meter.serial_number.toLowerCase().includes(meterSearchQuery.toLowerCase())
            );
        }
        return filtered;
    };

    const displayedMeters = selectedFacility ? getFilteredAndSearchedMeters() : [];

    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen flex flex-col">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Wprowadzanie Odczytów</h1>

            {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" className="mb-4" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}
            {!currentUserEmail && <Alert severity="warning" className="mb-4">Trwa ładowanie danych użytkownika lub użytkownik nie jest zalogowany.</Alert>}

            <Box display="flex" gap={2} mt={2} mb={3} alignItems="center" flexWrap="wrap">
                <Autocomplete
                    options={facilities}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedFacility}
                    onChange={(event, newValue) => {
                        setSelectedFacility(newValue);
                        setSelectedMeterTypeFilter(''); // Resetuj filtr typu licznika
                        setMeterSearchQuery('');      // Resetuj wyszukiwanie
                    }}
                    isOptionEqualToValue={(option, value) => option.name === value.name}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Wybierz obiekt (firmę)"
                            variant="outlined"
                            sx={{ width: 300 }}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoadingFacilities ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    disabled={!currentUserEmail}
                />
                <FormControl variant="outlined" sx={{ width: 250 }} disabled={!selectedFacility}>
                    <InputLabel id="meter-type-filter-label">Typ licznika</InputLabel>
                    <Select
                        labelId="meter-type-filter-label"
                        value={selectedMeterTypeFilter}
                        onChange={(e) => setSelectedMeterTypeFilter(e.target.value)}
                        label="Typ licznika"
                    >
                        <MenuItem value="">
                            <em>Wszystkie typy</em>
                        </MenuItem>
                        {COMMON_METER_TYPES.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Szukaj licznika po numerze"
                    variant="outlined"
                    value={meterSearchQuery}
                    onChange={(e) => setMeterSearchQuery(e.target.value)}
                    sx={{ width: 300 }}
                    disabled={!selectedFacility}
                />
            </Box>

            {isLoadingMeters && selectedFacility && <Box display="flex" justifyContent="center" my={2}><CircularProgress /></Box>}

            {selectedFacility && !isLoadingMeters && displayedMeters.length === 0 && (
                <Typography className="text-ars-darkgrey mt-2">
                    Brak liczników spełniających kryteria dla wybranego obiektu.
                </Typography>
            )}

            {selectedFacility && !isLoadingMeters && displayedMeters.length > 0 && (
                displayedMeters.map(meter => {
                    const meterReadings = readings.filter(r => r.meter_serial_number === meter.serial_number);
                    const isExpanded = !!expandedReadings[meter.serial_number];
                    return (
                        <Paper key={meter.serial_number} elevation={2} className="p-4 mb-4">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Box display="flex" alignItems="center">
                                    <IconButton
                                        onClick={() => toggleReadingsExpansion(meter.serial_number)}
                                        size="small"
                                        aria-label={isExpanded ? "Zwiń odczyty" : "Rozwiń odczyty"}
                                    >
                                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                    <Typography variant="h6" component="h3" className="text-md font-semibold text-ars-darkgrey ml-2">
                                        Licznik: {meter.serial_number} <span className="font-normal text-sm">({meter.meter_type})</span>
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenAddReadingDialog(meter)}
                                    disabled={!currentUserEmail || isSubmitting}
                                    sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                                >
                                    Dodaj Odczyt
                                </Button>
                            </Box>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                {isLoadingReadings && <Box textAlign="center" py={2}><CircularProgress size={20} /></Box>}
                                {!isLoadingReadings && meterReadings.length === 0 && (
                                    <Typography className="text-sm text-ars-darkgrey italic p-2">Brak odczytów dla tego licznika.</Typography>
                                )}
                                {!isLoadingReadings && meterReadings.length > 0 && (
                                    <TableContainer sx={{ mt: 1 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Wartość</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Jednostka</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Data Odczytu</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Zarejestrował</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Akcje</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {meterReadings.sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date)).map(reading => (
                                                    <TableRow key={`${reading.meter_serial_number}-${reading.reading_date}-${reading.email}-${reading.value}`}>
                                                        <TableCell>{reading.value}</TableCell>
                                                        <TableCell>{reading.unit || getUnitForMeterType(meter.meter_type)}</TableCell>
                                                        <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                                                        <TableCell>{reading.email}</TableCell>
                                                        <TableCell align="center">
                                                            <IconButton size="small" onClick={() => handleOpenEditReadingDialog(reading, meter.meter_type)} sx={{ color: 'var(--ars-lightblue)' }} disabled={isSubmitting}><EditIcon /></IconButton>
                                                            <IconButton size="small" onClick={() => handleOpenDeleteReadingDialog(reading)} sx={{ color: '#c82333' }} disabled={isSubmitting}><DeleteIcon /></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Collapse>
                        </Paper>
                    );
                })
            )}

            {/* Add Reading Dialog */}
            <Dialog open={openAddReadingDialog} onClose={() => { setOpenAddReadingDialog(false); setError(''); }} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Dodaj Nowy Odczyt</DialogTitle>
                <DialogContent>
                    {currentMeterForDialog && (
                        <>
                            <Typography gutterBottom>Licznik: <strong>{currentMeterForDialog.serial_number}</strong> ({currentMeterForDialog.meter_type})</Typography>
                            <Typography gutterBottom>Technik: <strong>{currentUserEmail}</strong></Typography>
                            <Typography gutterBottom>Data odczytu: <strong>{new Date().toLocaleDateString()}</strong></Typography>
                            <TextField // <-- DODANO: Pole dla Numeru Seryjnego Odczytu (ID)
                                margin="dense"
                                label="Numer Seryjny Odczytu (ID)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={newReadingIdInput}
                                onChange={(e) => setNewReadingIdInput(e.target.value)}
                                className="mb-3"
                                error={!!error && (error.toLowerCase().includes("numer seryjny odczytu") || error.toLowerCase().includes("id odczytu"))}
                                helperText={error && (error.toLowerCase().includes("numer seryjny odczytu") || error.toLowerCase().includes("id odczytu")) ? error : ""}
                            />
                            <TextField
                                autoFocus
                                margin="dense"
                                label={`Wartość odczytu (${getUnitForMeterType(currentMeterForDialog.meter_type)})`}
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={newReadingValue}
                                onChange={(e) => setNewReadingValue(e.target.value)}
                                className="mb-3"
                                InputProps={{
                                    endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{getUnitForMeterType(currentMeterForDialog.meter_type)}</Typography>
                                }}
                                error={!!error && error.toLowerCase().includes("wartość odczytu")} // Pokaż błąd walidacji w polu
                                helperText={error && error.toLowerCase().includes("wartość odczytu") ? error : (error && !error.toLowerCase().includes("numer seryjny odczytu") && !error.toLowerCase().includes("id odczytu") ? error : "")} // Wyświetl komunikat błędu pod polem, jeśli nie dotyczy ID
                            />
                            {/* Usunięto wyświetlanie ogólnego błędu tutaj, bo jest już helperText w polach */}
                        </>
                    )}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => { setOpenAddReadingDialog(false); setError(''); }} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={confirmAndCreateReading} variant="contained" disabled={isSubmitting || !newReadingValue.trim() || !newReadingIdInput.trim()} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}> {/* <-- ZMODYFIKOWANO: Warunek disabled */}
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Zapisz'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Reading Dialog */}
            <Dialog open={openEditReadingDialog} onClose={() => setOpenEditReadingDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Edytuj Odczyt</DialogTitle>
                <DialogContent>
                    {readingToEdit && (
                        <>
                            <Typography gutterBottom>Licznik: <strong>{readingToEdit.meter_serial_number}</strong> ({readingToEdit.meter_type})</Typography>
                            <Typography gutterBottom>Technik: <strong>{readingToEdit.user_email}</strong></Typography>
                            <Typography gutterBottom>Data odczytu: <strong>{new Date(readingToEdit.reading_date).toLocaleDateString()}</strong> (niezmienna)</Typography>
                            <TextField
                                autoFocus
                                margin="dense"
                                label={`Nowa wartość odczytu (${getUnitForMeterType(readingToEdit.meter_type)})`}
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={editedReadingValue}
                                onChange={(e) => setEditedReadingValue(e.target.value)}
                                className="mb-3"
                                InputProps={{
                                    endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{getUnitForMeterType(readingToEdit.meter_type)}</Typography>
                                }}
                            />
                            {error && <Alert severity="error" className="mt-2">{error}</Alert>}
                        </>
                    )}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => setOpenEditReadingDialog(false)} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={confirmAndUpdateReading} variant="contained" disabled={isSubmitting || !editedReadingValue.trim()} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Zapisz Zmiany'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Save Dialog */}
            <Dialog open={openConfirmSaveDialog} onClose={() => { setOpenConfirmSaveDialog(false); setPendingSaveAction(null); }} maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Potwierdzenie Zapisu</DialogTitle>
                <DialogContent>
                    <DialogContentText>Czy na pewno chcesz zapisać ten odczyt?</DialogContentText>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => { setOpenConfirmSaveDialog(false); setPendingSaveAction(null); }} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={executePendingSave} variant="contained" sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Potwierdź'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Reading Confirm Dialog */}
            <Dialog open={openDeleteReadingDialog} onClose={() => setOpenDeleteReadingDialog(false)} maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Potwierdzenie Usunięcia Odczytu</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Czy na pewno chcesz usunąć odczyt
                        {readingToDelete && ` wartości ${readingToDelete.value} ${readingToDelete.unit || getUnitForMeterType(meters.find(m => m.serial_number === readingToDelete.meter_serial_number)?.meter_type)} z dnia ${new Date(readingToDelete.reading_date).toLocaleDateString()}`}?
                        Tej operacji nie można cofnąć.
                    </DialogContentText>
                    {error && <Alert severity="error" className="mt-2">{error}</Alert>}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => setOpenDeleteReadingDialog(false)} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={confirmAndDeleteReading} variant="contained" sx={{ backgroundColor: '#c82333', color: 'white', '&:hover': { backgroundColor: '#a71d2a' } }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Usuń'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default TechnicianDataEntryPage;