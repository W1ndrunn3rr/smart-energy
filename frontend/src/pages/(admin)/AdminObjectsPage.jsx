import React, { useState, useEffect } from 'react';
import {
    Button, TextField, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, CircularProgress, Alert, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography,
    InputAdornment // Dodano InputAdornment
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Search as SearchIcon, // Dodano SearchIcon
    Clear as ClearIcon // Dodano ClearIcon
} from '@mui/icons-material';
import { API_URL } from '../../definitions';

const AdminObjectsPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [filteredFacilities, setFilteredFacilities] = useState([]); // Stan dla przefiltrowanych obiektów
    const [searchQuery, setSearchQuery] = useState(''); // Stan dla zapytania wyszukiwania
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Add Dialog
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newFacility, setNewFacility] = useState({ name: '', address: '', email: '' });

    // Edit Dialog
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [facilityToEdit, setFacilityToEdit] = useState(null);
    const [editedFacility, setEditedFacility] = useState({ name: '', address: '', email: '' });

    // Delete Dialog
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState(null);

    /**
     * Pobiera listę obiektów (facilities) z API i aktualizuje stan.
     * @function fetchFacilities
     * @returns {Promise<void>}
     */
    const fetchFacilities = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/facilities`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się pobrać obiektów.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setFacilities(data);
            } else if (data && Array.isArray(data.facilities)) {
                setFacilities(data.facilities);
            } else {
                setFacilities([]);
                setError('Otrzymano nieprawidłową strukturę danych dla obiektów.');
            }
        } catch (err) {
            setError(err.message);
            setFacilities([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    // Efekt do filtrowania obiektów na podstawie searchQuery
    useEffect(() => {
        if (Array.isArray(facilities)) {
            if (searchQuery.trim() === '') {
                setFilteredFacilities(facilities);
            } else {
                const lowercasedQuery = searchQuery.toLowerCase();
                const filtered = facilities.filter(facility =>
                    facility.name && facility.name.toLowerCase().includes(lowercasedQuery)
                );
                setFilteredFacilities(filtered);
            }
        } else {
            setFilteredFacilities([]);
        }
    }, [searchQuery, facilities]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };


    // Add Facility Handlers
    /**
     * Otwiera dialog dodawania nowego obiektu i resetuje stan formularza.
     * @function handleOpenAddDialog
     * @returns {void}
     */
    const handleOpenAddDialog = () => {
        setNewFacility({ name: '', address: '', email: '' });
        setError('');
        setSuccessMessage('');
        setOpenAddDialog(true);
    };
    const handleCloseAddDialog = () => setOpenAddDialog(false);
    const handleNewFacilityChange = (e) => {
        const { name, value } = e.target;
        setNewFacility(prev => ({ ...prev, [name]: value }));
    };
    /**
     * Dodaje nowy obiekt do systemu.
     * @function handleAddFacility
     * @returns {Promise<void>}
     */
    const handleAddFacility = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`${API_URL}/create_facility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFacility),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się dodać obiektu.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Obiekt "${newFacility.name}" został pomyślnie dodany.`);
            handleCloseAddDialog();
            fetchFacilities();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Edit Facility Handlers
    /**
     * Otwiera dialog edycji wybranego obiektu i ustawia stan formularza.
     * @function handleOpenEditDialog
     * @param {object} facility - Obiekt do edycji.
     * @returns {void}
     */
    const handleOpenEditDialog = (facility) => {
        setFacilityToEdit(facility);
        setEditedFacility({ name: facility.name, address: facility.address, email: facility.email });
        setError('');
        setSuccessMessage('');
        setOpenEditDialog(true);
    };
    const handleCloseEditDialog = () => setOpenEditDialog(false);
    const handleEditedFacilityChange = (e) => {
        const { name, value } = e.target;
        setEditedFacility(prev => ({ ...prev, [name]: value }));
    };
    /**
     * Aktualizuje dane wybranego obiektu.
     * @function handleUpdateFacility
     * @returns {Promise<void>}
     */
    const handleUpdateFacility = async () => {
        if (!facilityToEdit || !editedFacility) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        // The backend's PUT /update_facility endpoint expects an APIFacility model:
        // { name: string, address: string, email: string }
        // The 'name' field is used in the WHERE clause to identify the facility.
        // The current backend database logic only updates 'address' and 'email', not the 'name' itself.
        const payload = {
            name: facilityToEdit.name, // Use original name to identify the facility for update
            address: editedFacility.address, // New address from form
            email: editedFacility.email,     // New email from form
        };

        try {
            const response = await fetch(`${API_URL}/update_facility`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować obiektu.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Dane obiektu "${facilityToEdit.name}" (adres i email) zostały pomyślnie zaktualizowane.`);
            handleCloseEditDialog();
            fetchFacilities(); // Refresh the list
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete Facility Handlers
    /**
     * Otwiera dialog potwierdzenia usunięcia obiektu.
     * @function handleOpenDeleteDialog
     * @param {object} facility - Obiekt do usunięcia.
     * @returns {void}
     */
    const handleOpenDeleteDialog = (facility) => {
        setFacilityToDelete(facility);
        setError('');
        setSuccessMessage('');
        setOpenDeleteDialog(true);
    };
    const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);
    /**
     * Usuwa wybrany obiekt z systemu.
     * @function handleDeleteFacility
     * @returns {Promise<void>}
     */
    const handleDeleteFacility = async () => {
        if (!facilityToDelete) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // The DELETE endpoint uses facility_name in the URL
            const response = await fetch(`${API_URL}/facilities/${encodeURIComponent(facilityToDelete.name)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się usunąć obiektu.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Obiekt "${facilityToDelete.name}" został pomyślnie usunięty.`);
            handleCloseDeleteDialog();
            fetchFacilities();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const facilitiesToDisplay = filteredFacilities; // Używamy przefiltrowanej listy

    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen flex flex-col">
            {/* Zmieniono Typography na h1 z klasami Tailwind */}
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">
                Zarządzanie Obiektami
            </h1>

            {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" className="mb-4" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <TextField
                    placeholder="Szukaj obiektu po nazwie..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{ width: '40%' }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                        endAdornment: searchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={clearSearch}><ClearIcon fontSize="small" /></IconButton></InputAdornment>)
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                >
                    Dodaj Obiekt
                </Button>
            </Box>

            {isLoading && facilitiesToDisplay.length === 0 && (
                <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
            )}

            <Paper className="shadow-lg flex-grow overflow-hidden flex flex-col" elevation={3}> {/* Dodano overflow-hidden flex flex-col */}
                <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', flexGrow: 1 }}> {/* Dodano maxHeight i flexGrow */}
                    <Table stickyHeader aria-label="facilities table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Nazwa</TableCell>
                                <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Adres</TableCell>
                                <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell align="center" sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Akcje</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!isLoading && facilitiesToDisplay.length === 0 && !error && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center"> {/* Updated colSpan to 4 */}
                                        {searchQuery ? 'Brak wyników wyszukiwania.' : 'Brak obiektów do wyświetlenia.'}
                                    </TableCell>
                                </TableRow>
                            )}
                            {facilitiesToDisplay.map((facility, index) => (
                                <TableRow key={facility.name || index} sx={{ '&:hover': { backgroundColor: 'var(--ars-whitegrey)' } }}>
                                    <TableCell>{facility.name}</TableCell>
                                    <TableCell>{facility.address}</TableCell>
                                    <TableCell>{facility.email}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => handleOpenEditDialog(facility)} sx={{ color: 'var(--ars-lightblue)' }}><EditIcon /></IconButton>
                                        <IconButton size="small" onClick={() => handleOpenDeleteDialog(facility)} sx={{ color: '#c82333' }}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {facilitiesToDisplay.length > 0 && ( /* Dodano stopkę tabeli z liczbą obiektów */
                    <Box p={2} borderTop={1} borderColor="divider" textAlign="right">
                        Liczba obiektów: {facilitiesToDisplay.length}
                        {searchQuery && facilities.length > facilitiesToDisplay.length && (
                            <span className="ml-2 text-ars-darkgrey">(z {facilities.length} wszystkich)</span>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Add Facility Dialog */}
            <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
                <DialogTitle className="text-ars-deepblue">Dodaj Nowy Obiekt</DialogTitle>
                <DialogContent>
                    <DialogContentText className="mb-2">Wprowadź dane nowego obiektu.</DialogContentText>
                    {error && <Alert severity="error" className="mb-2" sx={{ width: '100%' }}>{error}</Alert>}
                    <TextField autoFocus margin="dense" name="name" label="Nazwa Obiektu" type="text" fullWidth variant="outlined" value={newFacility.name} onChange={handleNewFacilityChange} className="mb-3" />
                    <TextField margin="dense" name="address" label="Adres" type="text" fullWidth variant="outlined" value={newFacility.address} onChange={handleNewFacilityChange} className="mb-3" />
                    <TextField margin="dense" name="email" label="Email Kontaktowy" type="email" fullWidth variant="outlined" value={newFacility.email} onChange={handleNewFacilityChange} />
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseAddDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={handleAddFacility} variant="contained" disabled={isLoading} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Dodaj'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Facility Dialog */}
            {facilityToEdit && (
                <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                    <DialogTitle className="text-ars-deepblue">Edytuj Obiekt: {facilityToEdit.name}</DialogTitle>
                    <DialogContent>
                        {error && <Alert severity="error" className="mb-2" sx={{ width: '100%' }}>{error}</Alert>}
                        <TextField
                            disabled // Nazwa obiektu tylko do odczytu
                            margin="dense"
                            name="name"
                            label="Nazwa Obiektu (niezmienna)"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editedFacility.name}
                            // onChange={handleEditedFacilityChange} // Nie pozwalamy na zmianę
                            className="mb-3"
                        />
                        <TextField
                            autoFocus // Przeniesiono autoFocus na pierwsze edytowalne pole
                            margin="dense"
                            name="address"
                            label="Adres"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editedFacility.address}
                            onChange={handleEditedFacilityChange}
                            className="mb-3"
                        />
                        <TextField
                            margin="dense"
                            name="email"
                            label="Email" // Zmieniono label na "Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={editedFacility.email}
                            onChange={handleEditedFacilityChange}
                        />
                    </DialogContent>
                    <DialogActions className="p-4">
                        <Button onClick={handleCloseEditDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                        <Button onClick={handleUpdateFacility} variant="contained" disabled={isLoading} sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}>
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Zapisz Zmiany'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Facility Confirm Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle className="text-ars-deepblue">Potwierdzenie Usunięcia</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Czy na pewno chcesz usunąć obiekt <Typography component="span" fontWeight="bold">{facilityToDelete?.name}</Typography>? Tej operacji nie można cofnąć.
                    </DialogContentText>
                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseDeleteDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button onClick={handleDeleteFacility} variant="contained" disabled={isLoading} sx={{ backgroundColor: '#c82333', color: 'white', '&:hover': { backgroundColor: '#a71d2a' } }}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Usuń'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminObjectsPage;