import React, { useState, useEffect, useCallback } from 'react';
import {
    Button, TextField, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, CircularProgress, Alert, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography,
    Select, MenuItem, FormControl, InputLabel, Autocomplete, Collapse
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { API_URL } from '../../definitions';
import { sessionManager } from '../../scripts/session_manager';

const COMMON_METER_TYPES = ['Energia elektryczna', 'Energia klimatyzacja', 'Woda zimna', 'Woda ciepła', 'Licznik ciepła'];

/**
 * Zwraca jednostkę dla danego typu licznika.
 * @function getUnitForMeterType
 * @param {string} meterType - Typ licznika.
 * @returns {string} Jednostka (np. 'kWh', 'm³', 'GJ').
 */
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

/**
 * @function AdminMetersPage
 * @returns {JSX.Element} Strona administracyjna do zarządzania licznikami i odczytami.
 */
const AdminMetersPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [meters, setMeters] = useState([]);
    const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
    const [isLoadingMeters, setIsLoadingMeters] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openAddMeterDialog, setOpenAddMeterDialog] = useState(false);
    const [newMeter, setNewMeter] = useState({ serial_number: '', meter_type: COMMON_METER_TYPES[0], ppe: '', multiply_factor: 1, description: '' });

    const [openEditMeterDialog, setOpenEditMeterDialog] = useState(false);
    const [meterToEdit, setMeterToEdit] = useState(null);
    const [editedMeter, setEditedMeter] = useState({ serial_number: '', meter_type: '', ppe: '', multiply_factor: 1, description: '' });

    const [openDeleteMeterDialog, setOpenDeleteMeterDialog] = useState(false);
    const [meterToDelete, setMeterToDelete] = useState(null);

    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [readings, setReadings] = useState([]);
    const [isLoadingReadings, setIsLoadingReadings] = useState(false);
    const [isSubmittingReading, setIsSubmittingReading] = useState(false);
    const [openAddReadingDialog, setOpenAddReadingDialog] = useState(false);
    const [currentMeterForDialog, setCurrentMeterForDialog] = useState(null);
    const [newReadingValue, setNewReadingValue] = useState('');
    const [newReadingIdInput, setNewReadingIdInput] = useState('');
    const [openConfirmSaveDialog, setOpenConfirmSaveDialog] = useState(false);
    const [pendingSaveAction, setPendingSaveAction] = useState(null);
    const [expandedReadings, setExpandedReadings] = useState({});

    const [openEditReadingDialog, setOpenEditReadingDialog] = useState(false);
    const [readingToEdit, setReadingToEdit] = useState(null);
    const [editedReadingValue, setEditedReadingValue] = useState('');

    const [openDeleteReadingDialog, setOpenDeleteReadingDialog] = useState(false);
    const [readingToDelete, setReadingToDelete] = useState(null);

    const [showExtraConfirm, setShowExtraConfirm] = useState(false);
    const [pendingReadingData, setPendingReadingData] = useState(null);


    useEffect(() => {
        const email = sessionManager.getUserEmail();
        if (email) {
            setCurrentUserEmail(email);
        } else {
            console.warn("AdminMetersPage: Email użytkownika nie został znaleziony w sesji.");
        }
    }, []);

    useEffect(() => {
        const fetchFacilities = async () => {
            setIsLoadingFacilities(true);
            try {
                if (!currentUserEmail) {
                    setFacilities([]);
                    setIsLoadingFacilities(false);
                    return;
                }
                const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(currentUserEmail)}`);
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
    }, [currentUserEmail]);

    /**
     * Pobiera liczniki dla wybranego obiektu.
     * @function fetchMetersForFacility
     * @param {string} facilityName - Nazwa obiektu.
     * @returns {Promise<void>}
     */
    const fetchMetersForFacility = useCallback(async (facilityName) => {
        if (!facilityName) {
            setMeters([]);
            return;
        }
        setIsLoadingMeters(true);
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

    /**
     * Pobiera odczyty dla wybranego obiektu.
     * @function fetchReadingsForFacility
     * @param {string} facilityName - Nazwa obiektu.
     * @returns {Promise<void>}
     */
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
            fetchMetersForFacility(selectedFacility.name);
            fetchReadingsForFacility(selectedFacility.name);
            setExpandedReadings({});
        } else {
            setMeters([]);
            setReadings([]);
        }
    }, [selectedFacility, fetchMetersForFacility, fetchReadingsForFacility]);

    const handleOpenAddMeterDialog = () => {
        if (!selectedFacility) {
            setError("Najpierw wybierz obiekt.");
            return;
        }
        setNewMeter({ serial_number: '', meter_type: COMMON_METER_TYPES[0], ppe: '', multiply_factor: 1, description: '' });
        setError('');
        setSuccessMessage('');
        setOpenAddMeterDialog(true);
    };
    const handleCloseAddMeterDialog = () => setOpenAddMeterDialog(false);
    const handleNewMeterChange = (e) => {
        const { name, value } = e.target;
        setNewMeter(prev => ({
            ...prev,
            [name]: name === 'multiply_factor' ? (value === '' ? '' : parseFloat(value)) : value
        }));
    };
    /**
     * Dodaje nowy licznik do wybranego obiektu.
     * @function handleAddMeter
     * @returns {Promise<void>}
     */
    const handleAddMeter = async () => {
        if (!selectedFacility || !newMeter.serial_number.trim() || !newMeter.meter_type) {
            setError("Numer seryjny oraz typ licznika są wymagane.");
            return;
        }
        if (newMeter.meter_type === 'Energia elektryczna' && (!newMeter.ppe || !newMeter.ppe.trim())) {
            setError("Numer PPE jest wymagany dla liczników typu Energia elektryczna.");
            return;
        }
        if (newMeter.multiply_factor === '' || isNaN(parseFloat(newMeter.multiply_factor)) || parseFloat(newMeter.multiply_factor) <= 0) {
            setError("Mnożna musi być liczbą dodatnią.");
            return;
        }

        setIsLoadingMeters(true);
        setError('');
        setSuccessMessage('');
        try {
            const payload = {
                serial_number: newMeter.serial_number.trim(),
                meter_type: newMeter.meter_type,
                facility_name: selectedFacility.name,
                ppe: newMeter.meter_type === 'Energia elektryczna'
                    ? newMeter.ppe.trim()
                    : '-',
                multiply_factor: parseFloat(newMeter.multiply_factor),
                description: newMeter.description?.trim() || ''
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
            setSuccessMessage(`Licznik "${newMeter.serial_number}" (PPE: ${payload.ppe}, Mnożna: ${newMeter.multiply_factor}) został pomyślnie dodany do obiektu "${selectedFacility.name}".`);
            handleCloseAddMeterDialog();
            if (selectedFacility) fetchMetersForFacility(selectedFacility.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingMeters(false);
        }
    };

    const handleOpenEditMeterDialog = (meter) => {
        setMeterToEdit(meter);
        setEditedMeter({
            serial_number: meter.serial_number,
            meter_type: meter.meter_type,
            ppe: meter.ppe || '',
            multiply_factor: meter.multiply_factor !== undefined ? String(meter.multiply_factor) : '1',
            description: meter.description || ''
        });
        setError('');
        setSuccessMessage('');
        setOpenEditMeterDialog(true);
    };
    const handleCloseEditMeterDialog = () => setOpenEditMeterDialog(false);

    const handleEditedMeterChange = (e) => {
        const { name, value } = e.target;
        setEditedMeter(prev => ({
            ...prev,
            [name]: value
        }));
    };
    /**
     * Aktualizuje dane wybranego licznika.
     * @function handleUpdateMeter
     * @returns {Promise<void>}
     */
    const handleUpdateMeter = async () => {
        if (!meterToEdit || !selectedFacility || !editedMeter.meter_type || !editedMeter.ppe.trim()) {
            setError("Typ licznika oraz numer PPE są wymagane do aktualizacji.");
            return;
        }

        const multiplyFactorString = editedMeter.multiply_factor.trim();
        if (multiplyFactorString === '') {
            setError("Mnożna jest wymagana.");
            return;
        }
        const multiplyFactorValue = parseFloat(multiplyFactorString);
        if (isNaN(multiplyFactorValue) || multiplyFactorValue <= 0) {
            setError("Mnożna musi być liczbą dodatnią (większą od 0).");
            return;
        }

        setIsLoadingMeters(true);
        setError('');
        setSuccessMessage('');

        if (!meterToEdit || !selectedFacility) {
            setError("Nie można zaktualizować licznika: brak danych licznika lub obiektu.");
            setIsLoadingMeters(false);
            return;
        }

        const payload = {
            serial_number: meterToEdit.serial_number,
            meter_type: editedMeter.meter_type,
            facility_name: selectedFacility.name,
            ppe: editedMeter.ppe.trim(),
            multiply_factor: multiplyFactorValue,
            description: editedMeter.description?.trim() || ''
        };
        try {
            const response = await fetch(`${API_URL}/update_meter`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować licznika.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Licznik "${meterToEdit.serial_number}" został pomyślnie zaktualizowany.`);
            handleCloseEditMeterDialog();
            if (selectedFacility) fetchMetersForFacility(selectedFacility.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingMeters(false);
        }
    };

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

    const handleOpenAddReadingDialog = (meter) => {
        if (!currentUserEmail) {
            setError("Email administratora/managera nie jest dostępny. Nie można dodać odczytu.");
            return;
        }
        setCurrentMeterForDialog(meter);
        setNewReadingValue('');
        setNewReadingIdInput('');
        setError('');
        setSuccessMessage('');
        setOpenAddReadingDialog(true);
    };

    /**
     * Tworzy nowy odczyt dla wybranego licznika.
     * @function confirmAndCreateReading
     * @returns {void}
     */
    const confirmAndCreateReading = () => {
        if (!currentMeterForDialog || !newReadingValue.trim() || !selectedFacility || !newReadingIdInput.trim()) {
            setError("Numer seryjny odczytu (ID) oraz wartość odczytu są wymagane.");
            return;
        }
        const parsedReadingId = parseInt(newReadingIdInput, 10);
        if (isNaN(parsedReadingId)) {
            setError("Numer seryjny odczytu (ID) musi być liczbą całkowitą.");
            return;
        }

        setPendingSaveAction(() => async () => {
            setIsSubmittingReading(true);
            setError('');
            setSuccessMessage('');
            const readingData = {
                reading_id: parsedReadingId,
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
                setError(err.message);
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

    const handleOpenEditReadingDialog = (reading, meterType) => {
        setReadingToEdit({ ...reading, meter_type: meterType });
        setEditedReadingValue(reading.value.toString());
        setError('');
        setOpenEditReadingDialog(true);
    };

    /**
     * Aktualizuje istniejący odczyt licznika.
     * @function confirmAndUpdateReading
     * @returns {void}
     */
    const confirmAndUpdateReading = () => {
        if (!readingToEdit || !editedReadingValue.trim() || !selectedFacility) {
            setError("Wartość odczytu jest wymagana.");
            return;
        }
        if (readingToEdit.reading_id === undefined || readingToEdit.reading_id === null) {
            setError("Brak ID odczytu. Nie można zaktualizować.");
            console.error("confirmAndUpdateReading: reading_id is missing in readingToEdit", readingToEdit);
            return;
        }

        setPendingSaveAction(() => async () => {
            setIsSubmittingReading(true);
            setError('');
            setSuccessMessage('');
            const updatePayload = {
                reading_id: readingToEdit.reading_id,
                value: parseFloat(editedReadingValue),
                reading_date: new Date(readingToEdit.reading_date).toISOString().split('T')[0],
                meter_serial_number: readingToEdit.meter_serial_number,
                email: readingToEdit.email,
            };

            console.log('Attempting to update reading with payload:', updatePayload);
            try {
                const response = await fetch(`${API_URL}/update_reading`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload),
                });

                console.log('Update reading response status:', response.status);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować odczytu lub sparsować błędu.' }));
                    console.error('API Error Data:', errorData);
                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                }
                setSuccessMessage('Odczyt został pomyślnie zaktualizowany.');
                fetchReadingsForFacility(selectedFacility.name);
                setOpenEditReadingDialog(false);
            } catch (err) {
                console.error('Error in confirmAndUpdateReading:', err);
                setError(err.message);
            } finally {
                setIsSubmittingReading(false);
                setOpenConfirmSaveDialog(false);
                setPendingSaveAction(null);
            }
        });
        setOpenConfirmSaveDialog(true);
    };

    const handleOpenDeleteReadingDialog = (reading) => {
        if (reading.reading_id === undefined || reading.reading_id === null) {
            setError("Brak ID odczytu. Nie można usunąć.");
            console.error("handleOpenDeleteReadingDialog: reading_id is missing in reading", reading);
            return;
        }
        setReadingToDelete(reading);
        setError('');
        setOpenDeleteReadingDialog(true);
    };

    const handleCloseDeleteReadingDialog = () => {
        setOpenDeleteReadingDialog(false);
        setReadingToDelete(null);
    };

    /**
     * Usuwa wybrany odczyt licznika.
     * @function confirmAndDeleteReading
     * @returns {Promise<void>}
     */
    const confirmAndDeleteReading = async () => {
        if (!readingToDelete || !selectedFacility) {
            setError("Nie można usunąć odczytu. Brakujące dane.");
            return;
        }
        if (readingToDelete.reading_id === undefined || readingToDelete.reading_id === null) {
            setError("Brak ID odczytu. Nie można usunąć.");
            console.error("confirmAndDeleteReading: reading_id is missing in readingToDelete", readingToDelete);
            handleCloseDeleteReadingDialog();
            return;
        }

        setIsSubmittingReading(true);
        setError('');
        setSuccessMessage('');

        try {
            console.log(`Attempting to delete reading with ID: ${readingToDelete.reading_id}`);

            const response = await fetch(`${API_URL}/delete_reading/${readingToDelete.reading_id}`, {
                method: 'DELETE',
                headers: {
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się usunąć odczytu lub sparsować błędu.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Odczyt (ID: ${readingToDelete.reading_id}) został pomyślnie usunięty.`);
            fetchReadingsForFacility(selectedFacility.name);
            handleCloseDeleteReadingDialog();
        } catch (err) {
            console.error('Error deleting reading:', err);
            setError(err.message);
        } finally {
            setIsSubmittingReading(false);
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
                                                        <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Numer PPE</TableCell>
                                                        <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Mnożna</TableCell>
                                                        <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold', minWidth: '180px' }}>Opis</TableCell>
                                                        <TableCell align="center" sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold', minWidth: '200px' }}>Akcje</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredMeters.map((meter) => (
                                                        <React.Fragment key={meter.serial_number}>
                                                            <TableRow sx={{ '&:hover': { backgroundColor: 'var(--ars-whitegrey)' } }}>
                                                                <TableCell>{meter.serial_number}</TableCell>
                                                                <TableCell>{meter.ppe || '-'}</TableCell>
                                                                <TableCell>{meter.multiply_factor !== undefined ? meter.multiply_factor : '-'}</TableCell>
                                                                <TableCell>
                                                                    {meter.description && meter.description.trim() !== '' ? meter.description : <span style={{ color: '#888' }}>Brak opisu</span>}
                                                                </TableCell>
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
                                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
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
                                                                                            <TableCell sx={{ fontWeight: 'bold' }}>Wartość</TableCell>
                                                                                            <TableCell sx={{ fontWeight: 'bold' }}>Jednostka</TableCell>
                                                                                            <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                                                                                            <TableCell sx={{ fontWeight: 'bold' }}>Zarejestrował</TableCell>
                                                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Akcje</TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    <TableBody>
                                                                                        {(() => {
                                                                                            const meterReadings = readings
                                                                                                .filter(r => r.meter_serial_number === meter.serial_number)
                                                                                                .sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date)); // rosnąco po dacie

                                                                                            // Zbierz ID odczytów, które są mniejsze od poprzedniego
                                                                                            const errorReadingIds = [];
                                                                                            for (let i = 1; i < meterReadings.length; i++) {
                                                                                                const prev = parseFloat(meterReadings[i - 1].value);
                                                                                                const curr = parseFloat(meterReadings[i].value);
                                                                                                if (!isNaN(prev) && !isNaN(curr) && curr < prev) {
                                                                                                    errorReadingIds.push(meterReadings[i].reading_id);
                                                                                                }
                                                                                            }
                                                                                            const anyDrop = errorReadingIds.length > 0;

                                                                                            return (
                                                                                                <>
                                                                                                    {meterReadings.slice().reverse().map((reading) => (
                                                                                                        <TableRow
                                                                                                            key={`${reading.meter_serial_number}-${reading.reading_date}-${reading.email}-${reading.value}`}
                                                                                                            sx={errorReadingIds.includes(reading.reading_id) ? { backgroundColor: '#ffe066' } : {}}
                                                                                                        >
                                                                                                            <TableCell>{reading.value}</TableCell>
                                                                                                            <TableCell>{reading.unit || getUnitForMeterType(meter.meter_type)}</TableCell>
                                                                                                            <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                                                                                                            <TableCell>{reading.email}</TableCell>
                                                                                                            <TableCell align="center">
                                                                                                                <IconButton title="Edytuj odczyt" size="small" onClick={() => handleOpenEditReadingDialog(reading, meter.meter_type)} sx={{ color: 'var(--ars-lightblue)' }} disabled={isSubmittingReading}><EditIcon /></IconButton>
                                                                                                                <IconButton title="Usuń odczyt" size="small" onClick={() => handleOpenDeleteReadingDialog(reading)} sx={{ color: 'var(--ars-red)' }} disabled={isSubmittingReading}><DeleteIcon /></IconButton>
                                                                                                            </TableCell>
                                                                                                        </TableRow>
                                                                                                    ))}
                                                                                                    {anyDrop && (
                                                                                                        <TableRow>
                                                                                                            <TableCell colSpan={5} sx={{ backgroundColor: '#ffe066', color: '#b26a00', fontWeight: 'bold', display: 'flex', alignItems: 'center', borderBottom: 'none' }}>
                                                                                                                <WarningAmberIcon sx={{ color: '#b26a00', mr: 1 }} />
                                                                                                                Uwaga: W historii odczytów wykryto przypadek, gdzie odczyt jest mniejszy niż poprzedni! Sprawdź poprawność danych.
                                                                                                            </TableCell>
                                                                                                        </TableRow>
                                                                                                    )}
                                                                                                </>
                                                                                            );
                                                                                        })()}
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
                    <FormControl fullWidth margin="dense" className="mb-3">
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
                    {newMeter.meter_type === 'Energia elektryczna' && (
                        <TextField
                            margin="dense"
                            name="ppe"
                            label="Numer PPE"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newMeter.ppe}
                            onChange={handleNewMeterChange}
                            className="mb-3"
                            required
                            error={!!error && error.toLowerCase().includes("ppe")}
                            helperText="Wymagane dla liczników energii elektrycznej"
                        />
                    )}
                    <TextField
                        margin="dense"
                        name="multiply_factor"
                        label="Mnożna"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={newMeter.multiply_factor}
                        onChange={handleNewMeterChange}
                        InputProps={{ inputProps: { min: 0.01, step: "any" } }}
                        helperText="Domyślnie 1. Musi być liczbą dodatnią."
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="Opis (opcjonalnie)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newMeter.description}
                        onChange={handleNewMeterChange}
                        className="mb-3"
                        multiline
                        minRows={2}
                    />
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
                        <FormControl fullWidth margin="dense" className="mb-3">
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
                        <TextField
                            margin="dense"
                            name="ppe"
                            label="Numer PPE"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editedMeter.ppe}
                            onChange={handleEditedMeterChange}
                            className="mb-3"
                        />
                        <TextField
                            margin="dense"
                            name="multiply_factor"
                            label="Mnożna"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={editedMeter.multiply_factor}
                            onChange={handleEditedMeterChange}
                            InputProps={{ inputProps: { min: 0.01, step: "any" } }}
                            helperText="Musi być liczbą dodatnią (większą od 0)."
                        />
                        <TextField
                            margin="dense"
                            name="description"
                            label="Opis (opcjonalnie)"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editedMeter.description}
                            onChange={handleEditedMeterChange}
                            className="mb-3"
                            multiline
                            minRows={2}
                        />
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
                                error={!!error && error.toLowerCase().includes("wartość odczytu")}
                                helperText={error && error.toLowerCase().includes("wartość odczytu") ? error : ""}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={() => { setOpenAddReadingDialog(false); setError(''); }} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={confirmAndCreateReading} variant="contained" disabled={isSubmittingReading || !newReadingValue.trim() || !newReadingIdInput.trim()} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
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

            {/* Edit Reading Dialog - bez zmian w strukturze, tylko logika powyżej */}
            <Dialog open={openEditReadingDialog} onClose={() => setOpenEditReadingDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-deepblue">Edytuj Odczyt</DialogTitle>
                <DialogContent>
                    {readingToEdit && (
                        <>
                            <Typography gutterBottom>Licznik: <strong>{readingToEdit.meter_serial_number}</strong> ({readingToEdit.meter_type})</Typography>
                            <Typography gutterBottom>Zapisujący: <strong>{readingToEdit.email}</strong></Typography>
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
                    <Button onClick={confirmAndUpdateReading} variant="contained" disabled={isSubmittingReading || !editedReadingValue.trim()} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                        {isSubmittingReading ? <CircularProgress size={24} color="inherit" /> : 'Zapisz Zmiany'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Reading Confirmation Dialog */}
            <Dialog open={openDeleteReadingDialog} onClose={handleCloseDeleteReadingDialog} fullWidth maxWidth="xs">
                <DialogTitle className="text-ars-red">Potwierdź Usunięcie Odczytu</DialogTitle>
                <DialogContent>
                    {readingToDelete && (
                        <DialogContentText>
                            Czy na pewno chcesz usunąć odczyt wartości <strong>{readingToDelete.value}</strong>
                            {` ${getUnitForMeterType(readingToDelete.meter_type || meters.find(m => m.serial_number === readingToDelete.meter_serial_number)?.meter_type || '')}`}
                            <br />
                            dla licznika <strong>{readingToDelete.meter_serial_number}</strong>
                            <br />
                            z dnia <strong>{new Date(readingToDelete.reading_date).toLocaleDateString()}</strong>
                            (ID: {readingToDelete.reading_id})?
                        </DialogContentText>
                    )}
                    {error && <Alert severity="error" className="mt-2">{error}</Alert>}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseDeleteReadingDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button
                        onClick={confirmAndDeleteReading}
                        variant="contained"
                        disabled={isSubmittingReading}
                        sx={{
                            backgroundColor: 'var(--ars-red)',
                            color: 'red',
                            '&:hover': { backgroundColor: '#dc2626' }
                        }}
                    >
                        {isSubmittingReading ? <CircularProgress size={24} color="inherit" /> : 'Usuń'}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default AdminMetersPage;