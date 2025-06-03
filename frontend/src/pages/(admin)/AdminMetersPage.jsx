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
import { sessionManager } from '../../scripts/session_manager'; // Dodano import sessionManager

// Zaktualizowano COMMON_METER_TYPES na pięć kategorii
const COMMON_METER_TYPES = ['Energia elektryczna', 'Energia klimatyzacja', 'Woda zimna', 'Woda ciepła', 'Licznik ciepła'];

// Funkcja pomocnicza do uzyskania jednostki (skopiowana z TechnicianDataEntryPage)
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

const AdminMetersPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [meters, setMeters] = useState([]);
    const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
    const [isLoadingMeters, setIsLoadingMeters] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openAddMeterDialog, setOpenAddMeterDialog] = useState(false);
    const [newMeter, setNewMeter] = useState({ serial_number: '', meter_type: COMMON_METER_TYPES[0] });

    const [openEditMeterDialog, setOpenEditMeterDialog] = useState(false);
    const [meterToEdit, setMeterToEdit] = useState(null);
    const [editedMeter, setEditedMeter] = useState({ serial_number: '', meter_type: '' });

    const [openDeleteMeterDialog, setOpenDeleteMeterDialog] = useState(false);
    const [meterToDelete, setMeterToDelete] = useState(null);

    // Stany skopiowane/zaadaptowane z TechnicianDataEntryPage dla dodawania odczytów
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [readings, setReadings] = useState([]);
    const [isLoadingReadings, setIsLoadingReadings] = useState(false);
    const [isSubmittingReading, setIsSubmittingReading] = useState(false);
    const [openAddReadingDialog, setOpenAddReadingDialog] = useState(false);
    const [currentMeterForDialog, setCurrentMeterForDialog] = useState(null);
    const [newReadingValue, setNewReadingValue] = useState('');
    const [openConfirmSaveDialog, setOpenConfirmSaveDialog] = useState(false);
    const [pendingSaveAction, setPendingSaveAction] = useState(null);
    const [expandedReadings, setExpandedReadings] = useState({});


    useEffect(() => {
        const email = sessionManager.getUserEmail();
        if (email) {
            setCurrentUserEmail(email);
        } else {
            console.warn("AdminMetersPage: Email użytkownika nie został znaleziony w sesji.");
            // Można ustawić błąd, jeśli email jest absolutnie krytyczny do funkcjonowania strony
            // setError("Nie udało się zidentyfikować użytkownika. Funkcjonalność może być ograniczona.");
        }
    }, []);


    // Fetch all facilities for the dropdown
    useEffect(() => {
        const fetchFacilities = async () => {
            setIsLoadingFacilities(true);
            try {
                const response = await fetch(`${API_URL}/facilities`);
                if (!response.ok) throw new Error('Nie udało się pobrać listy obiektów.');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setFacilities(data);
                } else if (data && Array.isArray(data.facilities)) {
                    setFacilities(data.facilities);
                } else {
                    setFacilities([]);
                }
            } catch (err) {
                setError(err.message);
                setFacilities([]);
            } finally {
                setIsLoadingFacilities(false);
            }
        };
        fetchFacilities();
    }, []);

    // Fetch meters for the selected facility
    const fetchMetersForFacility = useCallback(async (facilityName) => {
        if (!facilityName) {
            setMeters([]);
            return;
        }
        setIsLoadingMeters(true);
        // setError(''); // Resetowanie błędu przy każdej próbie pobrania
        try {
            const response = await fetch(`${API_URL}/meters/${encodeURIComponent(facilityName)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Nie udało się pobrać liczników dla obiektu ${facilityName}. Status: ${response.status}` }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setMeters(data);
            } else if (data && Array.isArray(data.meters)) {
                setMeters(data.meters);
            } else {
                console.warn("Otrzymano nieoczekiwaną strukturę danych dla liczników:", data);
                setMeters([]);
            }
        } catch (err) {
            setError(`Błąd podczas pobierania liczników dla obiektu ${facilityName}: ${err.message}`);
            setMeters([]);
        } finally {
            setIsLoadingMeters(false);
        }
    }, []);

    // Fetch readings for the selected facility (skopiowane z TechnicianDataEntryPage)
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
            setError(prev => prev ? `${prev}\nNie udało się pobrać odczytów: ${err.message}` : `Nie udało się pobrać odczytów: ${err.message}`);
            setReadings([]);
        } finally {
            setIsLoadingReadings(false);
        }
    }, []);


    useEffect(() => {
        if (selectedFacility) {
            // setError(''); // Ostrożnie z resetowaniem błędów, mogą pochodzić z innych operacji
            // setSuccessMessage('');
            fetchMetersForFacility(selectedFacility.name);
            fetchReadingsForFacility(selectedFacility.name); // Dodano pobieranie odczytów
            setExpandedReadings({}); // Resetuj rozwinięcia przy zmianie obiektu
        } else {
            setMeters([]);
            setReadings([]); // Wyczyść odczyty, jeśli nie wybrano obiektu
            // setError('');
            // setSuccessMessage('');
        }
    }, [selectedFacility, fetchMetersForFacility, fetchReadingsForFacility]);

    // Add Meter Handlers
    const handleOpenAddMeterDialog = () => {
        if (!selectedFacility) {
            setError("Najpierw wybierz obiekt.");
            return;
        }
        setNewMeter({ serial_number: '', meter_type: COMMON_METER_TYPES[0] });
        setError('');
        setSuccessMessage('');
        setOpenAddMeterDialog(true);
    };
    const handleCloseAddMeterDialog = () => setOpenAddMeterDialog(false);
    const handleNewMeterChange = (e) => {
        const { name, value } = e.target;
        setNewMeter(prev => ({ ...prev, [name]: value }));
    };
    const handleAddMeter = async () => {
        if (!selectedFacility || !newMeter.serial_number.trim() || !newMeter.meter_type) {
            setError("Numer seryjny i typ licznika są wymagane.");
            return;
        }
        setIsLoadingMeters(true);
        setError('');
        setSuccessMessage('');
        try {
            const payload = {
                serial_number: newMeter.serial_number.trim(),
                meter_type: newMeter.meter_type,
                facility_name: selectedFacility.name
            };
            const response = await fetch(`${API_URL}/create_meter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się dodać licznika.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Licznik "${newMeter.serial_number}" (${newMeter.meter_type}) został pomyślnie dodany do obiektu "${selectedFacility.name}".`);
            handleCloseAddMeterDialog();
            if (selectedFacility) fetchMetersForFacility(selectedFacility.name); // Odśwież listę liczników
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingMeters(false);
        }
    };

    // Edit Meter Handlers
    const handleOpenEditMeterDialog = (meter) => {
        setMeterToEdit(meter);
        setEditedMeter({ serial_number: meter.serial_number, meter_type: meter.meter_type });
        setError('');
        setSuccessMessage('');
        setOpenEditMeterDialog(true);
    };
    const handleCloseEditMeterDialog = () => setOpenEditMeterDialog(false);
    const handleEditedMeterChange = (e) => {
        const { name, value } = e.target;
        setEditedMeter(prev => ({ ...prev, [name]: value }));
    };
    const handleUpdateMeter = async () => {
        if (!meterToEdit || !selectedFacility || !editedMeter.meter_type) {
            setError("Typ licznika jest wymagany do aktualizacji.");
            return;
        }
        setIsLoadingMeters(true);
        setError('');
        setSuccessMessage('');
        const payload = {
            meter_type: editedMeter.meter_type,
        };
        try {
            const response = await fetch(`${API_URL}/update_meter/${encodeURIComponent(meterToEdit.serial_number)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować licznika.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Licznik "${meterToEdit.serial_number}" został pomyślnie zaktualizowany (nowy typ: ${editedMeter.meter_type}).`);
            handleCloseEditMeterDialog();
            if (selectedFacility) fetchMetersForFacility(selectedFacility.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingMeters(false);
        }
    };

    // Delete Meter Handlers
    const handleOpenDeleteMeterDialog = (meter) => {
        setMeterToDelete(meter);
        setError('');
        setSuccessMessage('');
        setOpenDeleteMeterDialog(true);
    };
    const handleCloseDeleteMeterDialog = () => setOpenDeleteMeterDialog(false);
    const handleDeleteMeter = async () => {
        if (!meterToDelete || !selectedFacility) return;
        setIsLoadingMeters(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`${API_URL}/delete_meter/${encodeURIComponent(meterToDelete.serial_number)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się usunąć licznika.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Licznik "${meterToDelete.serial_number}" został pomyślnie usunięty.`);
            handleCloseDeleteMeterDialog();
            if (selectedFacility) fetchMetersForFacility(selectedFacility.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingMeters(false);
        }
    };

    // Funkcje do dodawania odczytów (skopiowane/zaadaptowane z TechnicianDataEntryPage)
    const handleOpenAddReadingDialog = (meter) => {
        if (!currentUserEmail) {
            setError("Email administratora/managera nie jest dostępny. Nie można dodać odczytu.");
            return;
        }
        setCurrentMeterForDialog(meter);
        setNewReadingValue('');
        setError(''); // Czyść błędy specyficzne dla tego dialogu
        setSuccessMessage('');
        setOpenAddReadingDialog(true);
    };

    const confirmAndCreateReading = () => {
        if (!currentMeterForDialog || !newReadingValue.trim() || !selectedFacility) {
            setError("Wartość odczytu jest wymagana."); // Błąd powinien pojawić się w dialogu
            return;
        }
        setPendingSaveAction(() => async () => {
            setIsSubmittingReading(true);
            setError('');
            setSuccessMessage('');
            const readingData = {
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
                setSuccessMessage(`Odczyt dla licznika ${currentMeterForDialog.serial_number} został pomyślnie zapisany.`);
                fetchReadingsForFacility(selectedFacility.name);
                setOpenAddReadingDialog(false);
            } catch (err) {
                setError(err.message); // Błąd wyświetlany na stronie lub w dialogu
            } finally {
                setIsSubmittingReading(false);
                setOpenConfirmSaveDialog(false);
                setPendingSaveAction(null);
            }
        });
        setOpenConfirmSaveDialog(true);
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


    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen flex flex-col">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">
                Zarządzanie Licznikami
            </h1>

            {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" className="mb-4" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

            <Box mt={4} mb={3} display="flex" alignItems="center" gap={2}>
                <Autocomplete
                    options={facilities}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedFacility}
                    onChange={(event, newValue) => {
                        setSelectedFacility(newValue);
                    }}
                    isOptionEqualToValue={(option, value) => option.name === value.name}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Wybierz lub wyszukaj obiekt"
                            variant="outlined"
                            sx={{ width: 350 }}
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
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddMeterDialog}
                    disabled={!selectedFacility || isLoadingMeters}
                    sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                >
                    Dodaj Licznik
                </Button>
            </Box>

            {selectedFacility && (
                <h2 className="text-xl font-semibold mb-3 text-ars-deepblue">
                    Liczniki dla obiektu: <span className="font-semibold">{selectedFacility.name}</span>
                </h2>
            )}

            {(isLoadingMeters && selectedFacility) && (
                <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
            )}

            {selectedFacility && !isLoadingMeters && (
                <>
                    {COMMON_METER_TYPES.map(meterTypeCategory => {
                        const filteredMeters = meters.filter(meter => meter.meter_type === meterTypeCategory);

                        return (
                            <Box key={meterTypeCategory} mt={filteredMeters.length > 0 || meters.length === 0 ? 3 : 1} mb={3}>
                                {meters.length > 0 && (
                                    <h3 className="text-lg font-semibold mb-2 text-ars-deepblue">
                                        Liczniki typu: <span className="font-semibold">{meterTypeCategory}</span>
                                    </h3>
                                )}
                                {filteredMeters.length > 0 ? (
                                    <Paper className="shadow-lg" elevation={3}>
                                        <TableContainer>
                                            <Table stickyHeader aria-label={`meters table ${meterTypeCategory}`}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Numer Seryjny</TableCell>
                                                        <TableCell align="center" sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold', minWidth: '200px' }}>Akcje</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredMeters.map((meter) => (
                                                        <React.Fragment key={meter.serial_number}>
                                                            <TableRow sx={{ '&:hover': { backgroundColor: 'var(--ars-whitegrey)' } }}>
                                                                <TableCell>{meter.serial_number}</TableCell>
                                                                <TableCell align="center">
                                                                    <IconButton title="Edytuj licznik" size="small" onClick={() => handleOpenEditMeterDialog(meter)} sx={{ color: 'var(--ars-lightblue)' }}><EditIcon /></IconButton>
                                                                    <IconButton title="Usuń licznik" size="small" onClick={() => handleOpenDeleteMeterDialog(meter)} sx={{ color: '#c82333' }}><DeleteIcon /></IconButton>
                                                                    <IconButton title="Dodaj odczyt" size="small" onClick={() => handleOpenAddReadingDialog(meter)} sx={{ color: 'green' }} disabled={isSubmittingReading}>
                                                                        <AddIcon />
                                                                    </IconButton>
                                                                    <IconButton title={expandedReadings[meter.serial_number] ? "Zwiń odczyty" : "Pokaż odczyty"} size="small" onClick={() => toggleReadingsExpansion(meter.serial_number)}>
                                                                        {expandedReadings[meter.serial_number] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                            <TableRow>
                                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                                                                    <Collapse in={expandedReadings[meter.serial_number]} timeout="auto" unmountOnExit>
                                                                        <Box margin={1} p={2} sx={{ border: '1px solid var(--ars-grey)', borderRadius: '4px' }}>
                                                                            <Typography variant="subtitle1" gutterBottom component="div" fontWeight="bold">
                                                                                Odczyty dla licznika: {meter.serial_number}
                                                                            </Typography>
                                                                            {isLoadingReadings && <CircularProgress size={20} />}
                                                                            {!isLoadingReadings && readings.filter(r => r.meter_serial_number === meter.serial_number).length === 0 && (
                                                                                <Typography variant="body2" fontStyle="italic">Brak odczytów dla tego licznika.</Typography>
                                                                            )}
                                                                            {!isLoadingReadings && readings.filter(r => r.meter_serial_number === meter.serial_number).length > 0 && (
                                                                                <Table size="small" aria-label="odczyty">
                                                                                    <TableHead>
                                                                                        <TableRow>
                                                                                            <TableCell sx={{fontWeight: 'bold'}}>Wartość</TableCell>
                                                                                            <TableCell sx={{fontWeight: 'bold'}}>Jednostka</TableCell>
                                                                                            <TableCell sx={{fontWeight: 'bold'}}>Data</TableCell>
                                                                                            <TableCell sx={{fontWeight: 'bold'}}>Zarejestrował</TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    <TableBody>
                                                                                        {readings
                                                                                            .filter(r => r.meter_serial_number === meter.serial_number)
                                                                                            .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date))
                                                                                            .map((reading) => (
                                                                                                <TableRow key={`${reading.meter_serial_number}-${reading.reading_date}-${reading.email}-${reading.value}`}>
                                                                                                    <TableCell>{reading.value}</TableCell>
                                                                                                    <TableCell>{reading.unit || getUnitForMeterType(meter.meter_type)}</TableCell>
                                                                                                    <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                                                                                                    <TableCell>{reading.email}</TableCell>
                                                                                                </TableRow>
                                                                                            ))}
                                                                                    </TableBody>
                                                                                </Table>
                                                                            )}
                                                                        </Box>
                                                                    </Collapse>
                                                                </TableCell>
                                                            </TableRow>
                                                        </React.Fragment>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                ) : (
                                    meters.length > 0 && (
                                        <p className="text-ars-darkgrey ml-1 text-sm">
                                            Brak liczników tego typu.
                                        </p>
                                    )
                                )}
                            </Box>
                        );
                    })}
                    {meters.length === 0 && selectedFacility && !isLoadingMeters && (
                        <p className="mt-4 text-ars-darkgrey text-center text-base">
                            Brak jakichkolwiek liczników przypisanych do obiektu: <span className="font-bold">{selectedFacility.name}</span>.
                        </p>
                    )}
                </>
            )}
            {!selectedFacility && !isLoadingFacilities && (
                <p className="mt-2 text-ars-darkgrey text-base">
                    Wybierz obiekt, aby zobaczyć lub dodać liczniki.
                </p>
            )}


            {/* Add Meter Dialog */}
            <Dialog open={openAddMeterDialog} onClose={handleCloseAddMeterDialog} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Dodaj Nowy Licznik do {selectedFacility?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="serial_number"
                        label="Numer Seryjny"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newMeter.serial_number}
                        onChange={handleNewMeterChange}
                        className="mb-3"
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="add-meter-type-select-label">Typ Licznika</InputLabel>
                        <Select
                            labelId="add-meter-type-select-label"
                            id="add-meter-type-select"
                            name="meter_type"
                            value={newMeter.meter_type}
                            label="Typ Licznika"
                            onChange={handleNewMeterChange}
                        >
                            {COMMON_METER_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseAddMeterDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={handleAddMeter} variant="contained" disabled={isLoadingMeters} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                        {isLoadingMeters ? <CircularProgress size={24} color="inherit" /> : 'Dodaj Licznik'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Meter Dialog */}
            {meterToEdit && (
                <Dialog open={openEditMeterDialog} onClose={handleCloseEditMeterDialog} fullWidth maxWidth="xs">
                    <DialogTitle className="text-ars-deepblue">Edytuj Licznik: {meterToEdit.serial_number}</DialogTitle>
                    <DialogContent>
                        <TextField
                            disabled
                            margin="dense"
                            name="serial_number"
                            label="Numer Seryjny"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editedMeter.serial_number}
                            className="mb-3"
                        />
                        <FormControl fullWidth margin="dense">
                            <InputLabel id="edit-meter-type-select-label">Typ Licznika</InputLabel>
                            <Select
                                labelId="edit-meter-type-select-label"
                                id="edit-meter-type-select"
                                name="meter_type"
                                value={editedMeter.meter_type}
                                label="Typ Licznika"
                                onChange={handleEditedMeterChange}
                                autoFocus
                            >
                                {COMMON_METER_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions className="p-4">
                        <Button onClick={handleCloseEditMeterDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                        <Button onClick={handleUpdateMeter} variant="contained" disabled={isLoadingMeters} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                            {isLoadingMeters ? <CircularProgress size={24} color="inherit" /> : 'Zapisz Zmiany'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Meter Confirm Dialog */}
            <Dialog open={openDeleteMeterDialog} onClose={handleCloseDeleteMeterDialog}>
                <DialogTitle className="text-ars-deepblue">Potwierdzenie Usunięcia Licznika</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Czy na pewno chcesz usunąć licznik <Typography component="span" fontWeight="bold">{meterToDelete?.serial_number}</Typography>
                        (typ: {meterToDelete?.meter_type}) z obiektu {selectedFacility?.name}? Tej operacji nie można cofnąć.
                    </DialogContentText>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseDeleteMeterDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={handleDeleteMeter} variant="contained" disabled={isLoadingMeters} sx={{ backgroundColor: '#c82333', color: 'white', '&:hover': { backgroundColor: '#a71d2a' } }}>
                        {isLoadingMeters ? <CircularProgress size={24} color="inherit" /> : 'Usuń'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Reading Dialog (skopiowane z TechnicianDataEntryPage) */}
            <Dialog open={openAddReadingDialog} onClose={() => { setOpenAddReadingDialog(false); setError(''); }} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Dodaj Nowy Odczyt</DialogTitle>
                <DialogContent>
                    {currentMeterForDialog && (
                        <>
                            <Typography gutterBottom>Licznik: <strong>{currentMeterForDialog.serial_number}</strong> ({currentMeterForDialog.meter_type})</Typography>
                            <Typography gutterBottom>Zapisujący: <strong>{currentUserEmail}</strong></Typography>
                            <Typography gutterBottom>Data odczytu: <strong>{new Date().toLocaleDateString()}</strong></Typography>
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
                                error={!!error} // Pokaż błąd walidacji w polu
                                helperText={error} // Wyświetl komunikat błędu pod polem
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => { setOpenAddReadingDialog(false); setError(''); }} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={confirmAndCreateReading} variant="contained" disabled={isSubmittingReading || !newReadingValue.trim()} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                        {isSubmittingReading ? <CircularProgress size={24} color="inherit" /> : 'Zapisz'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Save Dialog (skopiowane z TechnicianDataEntryPage) */}
            <Dialog open={openConfirmSaveDialog} onClose={() => { setOpenConfirmSaveDialog(false); setPendingSaveAction(null); }} maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Potwierdzenie Zapisu</DialogTitle>
                <DialogContent>
                    <DialogContentText>Czy na pewno chcesz zapisać ten odczyt?</DialogContentText>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => { setOpenConfirmSaveDialog(false); setPendingSaveAction(null); }} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={executePendingSave} variant="contained" sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }} disabled={isSubmittingReading}>
                        {isSubmittingReading ? <CircularProgress size={24} color="inherit" /> : 'Potwierdź'}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default AdminMetersPage;