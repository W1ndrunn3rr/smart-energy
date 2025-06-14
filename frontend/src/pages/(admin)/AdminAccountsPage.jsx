import React, { useState, useEffect } from 'react';
import {
    Button, TextField, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    CircularProgress, Alert, IconButton, Box, InputAdornment, Typography, Collapse, List, ListItem, ListItemText
} from '@mui/material';
import {
    Edit as EditIcon,
    Add as AddIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Delete as DeleteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { API_URL } from '../../definitions';

const getAccessLevelName = (level) => {
    switch (level) {
        case 1: return 'Administrator';
        case 2: return 'Manager';
        case 3: return 'Technik';
        case 4: return 'User (Gość)';
        default: return 'Nieznany';
    }
};

const AdminAccountsPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', access_level: 4 });

    const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Stany dla edycji użytkownika
    const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [editedUser, setEditedUser] = useState({ id: null, email: '', access_level: 4, newPassword: '' });

    // Nowe stany dla rozwijania listy obiektów
    const [expandedUserEmail, setExpandedUserEmail] = useState(null);
    const [facilitiesForUser, setFacilitiesForUser] = useState([]);
    const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);

    const [allFacilities, setAllFacilities] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState('');

    /**
     * Pobiera listę użytkowników z API i aktualizuje stan.
     * @function fetchUsers
     * @returns {Promise<void>}
     */
    const fetchUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się pobrać użytkowników.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setUsers(data);
            } else if (data && Array.isArray(data.users)) {
                setUsers(data.users);
            } else if (data && Array.isArray(data.data)) {
                setUsers(data.data);
            } else {
                setError('Otrzymano nieprawidłową strukturę danych z serwera');
                setUsers([]);
            }
        } catch (err) {
            setError(err.message);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (Array.isArray(users)) {
            if (searchQuery.trim() === '') {
                setFilteredUsers(users);
            } else {
                const lowercasedQuery = searchQuery.toLowerCase();
                const filtered = users.filter(user =>
                    user.email && user.email.toLowerCase().includes(lowercasedQuery)
                );
                setFilteredUsers(filtered);
            }
        } else {
            setFilteredUsers([]);
        }
    }, [searchQuery, users]);

    const handleSearchChange = (e) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    // --- CRUD Operacje ---
    // ADD User
    const handleOpenAddUserDialog = () => {
        setNewUser({ email: '', password: '', access_level: 4 });
        setError('');
        setSuccessMessage('');
        setOpenAddUserDialog(true);
    };
    const handleCloseAddUserDialog = () => setOpenAddUserDialog(false);
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };
    /**
     * Dodaje nowego użytkownika do systemu.
     * @function handleAddUser
     * @returns {Promise<void>}
     */
    const handleAddUser = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // Usunięto hashowanie hasła. Hasło jest wysyłane jako tekst jawny.
            // Zgodnie z obrazkiem API, endpoint /create_user oczekuje jawnego hasła.
            const payload = {
                email: newUser.email,
                password: newUser.password, // Wysyłanie jawnego hasła
                access_level: parseInt(newUser.access_level, 10), // Upewnij się, że access_level jest liczbą
            };

            const response = await fetch(`${API_URL}/create_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nie udało się dodać użytkownika.' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage(`Użytkownik ${newUser.email} został pomyślnie dodany.`);
            handleCloseAddUserDialog();
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // EDIT User
    const handleOpenEditUserDialog = (user) => {
        setUserToEdit(user);
        setEditedUser({// Zachowujemy ID, jeśli jest używane
            email: user.email, // Email jest teraz tylko do odczytu w tym stanie
            access_level: user.access_level,
            newPassword: ''
        });
        setError('');
        setSuccessMessage('');
        setOpenEditUserDialog(true);
    };
    const handleCloseEditUserDialog = () => {
        setOpenEditUserDialog(false);
        setUserToEdit(null);
    };
    const handleEditedUserChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditedUser(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    /**
     * Aktualizuje dane wybranego użytkownika (hasło i/lub poziom dostępu).
     * @function handleUpdateUser
     * @returns {Promise<void>}
     */
    const handleUpdateUser = async () => {
        if (!editedUser || !userToEdit) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        let passwordUpdateSuccess = true;
        let roleUpdateSuccess = true;
        let messages = [];

        // 1. Aktualizacja hasła, jeśli zostało zmienione
        if (editedUser.newPassword && editedUser.newPassword.trim() !== '') {
            const newPasswordTrimmed = editedUser.newPassword.trim();
            // Usunięto hashowanie hasła. Hasło jest wysyłane jako tekst jawny.
            // API endpoint /update_user_password oczekuje jawnego hasła
            // pod parametrem 'hashed_password' (zgodnie z obrazkiem).

            try {
                // Parametr w URL to 'hashed_password', ale teraz będzie zawierał jawne hasło.
                const passwordUpdateUrlString = `${API_URL}/update_user_password?user_email=${encodeURIComponent(userToEdit.email)}&new_password=${encodeURIComponent(newPasswordTrimmed)}`;
                console.log('Aktualizacja hasła - URL:', passwordUpdateUrlString);
                console.log('Aktualizacja hasła - wysyłane "hashed_password" (powinno być jawne):', newPasswordTrimmed);
                const response = await fetch(passwordUpdateUrlString, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować hasła.' }));
                    throw new Error(errorData.detail || `Błąd aktualizacji hasła: ${response.status}`);
                }
                messages.push('Hasło zostało pomyślnie zaktualizowane.');
            } catch (err) {
                console.error("Błąd podczas aktualizacji hasła:", err);
                setError(prev => prev ? `${prev}\n${err.message}` : err.message);
                passwordUpdateSuccess = false;
            }
        }

        // 2. Aktualizacja roli, jeśli została zmieniona
        const newAccessLevel = parseInt(editedUser.access_level, 10);
        if (newAccessLevel !== userToEdit.access_level) {
            try {
                // Bezpośrednie budowanie URL jako string dla aktualizacji roli
                const roleUpdateUrlString = `${API_URL}/update_user_role?user_email=${encodeURIComponent(userToEdit.email)}&user_role=${encodeURIComponent(newAccessLevel.toString())}`;

                const response = await fetch(roleUpdateUrlString, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Nie udało się zaktualizować roli.' }));
                    throw new Error(errorData.detail || `Błąd aktualizacji roli: ${response.status}`);
                }
                messages.push('Rola użytkownika została pomyślnie zaktualizowana.');
            } catch (err) {
                console.error("Błąd podczas aktualizacji roli:", err);
                setError(prev => prev ? `${prev}\n${err.message}` : err.message);
                roleUpdateSuccess = false;
            }
        }

        setIsLoading(false);

        if (messages.length > 0) {
            setSuccessMessage(messages.join(' '));
        }

        if (passwordUpdateSuccess && roleUpdateSuccess) {
            if ((editedUser.newPassword && editedUser.newPassword.trim() !== '' && passwordUpdateSuccess) ||
                (newAccessLevel !== userToEdit.access_level && roleUpdateSuccess) ||
                (!(editedUser.newPassword && editedUser.newPassword.trim() !== '') && !(newAccessLevel !== userToEdit.access_level))) {
                handleCloseEditUserDialog();
                fetchUsers();
            }
        }
    };

    // DELETE User
    const handleOpenDeleteConfirmDialog = (user) => {
        setUserToDelete(user);
        setOpenDeleteConfirmDialog(true);
        setError('');
        setSuccessMessage('');
    };
    const handleCloseDeleteConfirmDialog = () => {
        setUserToDelete(null);
        setOpenDeleteConfirmDialog(false);
    };
    /**
     * Usuwa wybranego użytkownika z systemu.
     * @function handleDeleteUser
     * @returns {Promise<void>}
     */
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`${API_URL}/users/${userToDelete.email}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                let errorDetail = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorData.message || errorDetail;
                } catch (e) { console.error('Error parsing response:', e); }
                throw new Error(errorDetail);
            }
            setSuccessMessage(`Użytkownik ${userToDelete.email} został pomyślnie usunięty.`);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            handleCloseDeleteConfirmDialog();
        }
    };

    // Funkcja do pobrania facilities dla danego użytkownika
    /**
     * Pobiera listę obiektów przypisanych do użytkownika i aktualizuje stan rozwinięcia.
     * @function handleToggleFacilities
     * @param {object} user - Obiekt użytkownika.
     * @returns {Promise<void>}
     */
    const handleToggleFacilities = async (user) => {
        if (expandedUserEmail === user.email) {
            setExpandedUserEmail(null);
            setFacilitiesForUser([]);
            return;
        }
        setExpandedUserEmail(user.email);
        setFacilitiesForUser([]);
        setIsLoadingFacilities(true);
        try {
            const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(user.email)}`);
            if (!response.ok) throw new Error('Nie udało się pobrać obiektów dla użytkownika.');
            const data = await response.json();
            const facilitiesArray = Array.isArray(data) ? data : (data.facilities || []);
            setFacilitiesForUser(facilitiesArray);
        } catch (err) {
            setFacilitiesForUser([]);
        } finally {
            setIsLoadingFacilities(false);
        }
    };

    // Pobierz wszystkie dostępne obiekty (facilities) do przypisywania
    useEffect(() => {
        const fetchAllFacilities = async () => {
            try {
                const response = await fetch(`${API_URL}/facilities`);
                if (!response.ok) throw new Error('Nie udało się pobrać wszystkich obiektów.');
                const data = await response.json();
                setAllFacilities(Array.isArray(data) ? data : (data.facilities || []));
            } catch (err) {
                setAllFacilities([]);
            }
        };
        fetchAllFacilities();
    }, []);

    // Dodaj funkcję pomocniczą:
    /**
     * Odświeża listę obiektów przypisanych do użytkownika.
     * @function refreshFacilitiesForUser
     * @param {string} userEmail - Email użytkownika.
     * @returns {Promise<void>}
     */
    const refreshFacilitiesForUser = async (userEmail) => {
        setIsLoadingFacilities(true);
        try {
            const response = await fetch(`${API_URL}/facilities/user/${encodeURIComponent(userEmail)}`);
            if (!response.ok) throw new Error('Nie udało się pobrać obiektów dla użytkownika.');
            const data = await response.json();
            const facilitiesArray = Array.isArray(data) ? data : (data.facilities || []);
            setFacilitiesForUser(facilitiesArray);
        } catch (err) {
            setFacilitiesForUser([]);
        } finally {
            setIsLoadingFacilities(false);
        }
    };

    /**
     * Przypisuje użytkownika do wybranego obiektu.
     * @function handleAssignFacility
     * @param {string} userEmail - Email użytkownika.
     * @param {string} facilityName - Nazwa obiektu.
     * @returns {Promise<void>}
     */
    const handleAssignFacility = async (userEmail, facilityName) => {
        setAssignLoading(true);
        setAssignError('');
        try {
            const response = await fetch(`${API_URL}/facilities/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, facility_name: facilityName }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się przypisać obiektu.');
            }
            // Odśwież tylko facilities, nie zamykaj rozwinięcia
            await refreshFacilitiesForUser(userEmail);
        } catch (err) {
            setAssignError(err.message);
        } finally {
            setAssignLoading(false);
        }
    };

    /**
     * Usuwa przypisanie użytkownika do wybranego obiektu.
     * @function handleUnassignFacility
     * @param {string} userEmail - Email użytkownika.
     * @param {string} facilityName - Nazwa obiektu.
     * @returns {Promise<void>}
     */
    const handleUnassignFacility = async (userEmail, facilityName) => {
        setAssignLoading(true);
        setAssignError('');
        try {
            const response = await fetch(`${API_URL}/unassign/facility`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, facility_name: facilityName }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Nie udało się usunąć przypisania.');
            }
            // Odśwież tylko facilities, nie zamykaj rozwinięcia
            await refreshFacilitiesForUser(userEmail);
        } catch (err) {
            setAssignError(err.message);
        } finally {
            setAssignLoading(false);
        }
    };

    const usersToDisplay = filteredUsers;

    return (
        <div className="p-6 bg-ars-whitegrey min-h-screen flex flex-col">
            <h1 className="text-3xl font-bold mb-6 text-ars-deepblue">Zarządzanie Kontami</h1>

            {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" className="mb-4" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <TextField
                    placeholder="Szukaj użytkownika po emailu..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ width: '40%' }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                        endAdornment: searchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={clearSearch}><ClearIcon fontSize="small" /></IconButton></InputAdornment>)
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddUserDialog}
                    sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                >
                    Dodaj użytkownika
                </Button>
            </Box>

            {isLoading && usersToDisplay.length === 0 && (
                <Box display="flex" justifyContent="center" my={5}>
                    <CircularProgress />
                </Box>
            )}

            <Paper className="shadow-lg flex-grow overflow-hidden flex flex-col" elevation={3}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', flexGrow: 1 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }} />
                                <TableCell sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell align="right" sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Poziom dostępu</TableCell>
                                <TableCell align="center" sx={{ backgroundColor: 'var(--ars-deepblue)', color: 'white', fontWeight: 'bold' }}>Akcje</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usersToDisplay.length > 0 ? (
                                usersToDisplay.map((user) => (
                                    <React.Fragment key={user.id || user.email}>
                                        <TableRow
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'var(--ars-whitegrey)' } }}
                                        >
                                            <TableCell align="center" sx={{ width: 48 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleToggleFacilities(user)}
                                                    aria-label={expandedUserEmail === user.email ? "Ukryj obiekty" : "Pokaż obiekty"}
                                                >
                                                    {expandedUserEmail === user.email ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell component="th" scope="row">{user.email || 'Brak emaila'}</TableCell>
                                            <TableCell align="right">{getAccessLevelName(user.access_level)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => handleOpenEditUserDialog(user)} sx={{ color: 'var(--ars-lightblue)' }}><EditIcon /></IconButton>
                                                <IconButton size="small" onClick={() => handleOpenDeleteConfirmDialog(user)} sx={{ color: '#c82333' }}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ p: 0, border: 0, background: '#f7fafd' }}>
                                                <Collapse in={expandedUserEmail === user.email} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: 2, display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                                                        <Box flex={1}>
                                                            <Typography variant="subtitle2" className="mb-2" sx={{ color: 'var(--ars-deepblue)' }}>
                                                                Obiekty przypisane do użytkownika
                                                            </Typography>
                                                            {isLoadingFacilities && expandedUserEmail === user.email ? (
                                                                <Box display="flex" justifyContent="center" alignItems="center" height={60}>
                                                                    <CircularProgress size={24} />
                                                                </Box>
                                                            ) : facilitiesForUser.length > 0 && expandedUserEmail === user.email ? (
                                                                <List dense>
                                                                    {facilitiesForUser.map((facility) => (
                                                                        <ListItem key={facility.name}>
                                                                            <ListItemText
                                                                                primary={facility.name}
                                                                                secondary={facility.address ? `Adres: ${facility.address}` : null}
                                                                            />
                                                                            <IconButton
                                                                                edge="end"
                                                                                color="error"
                                                                                size="small"
                                                                                disabled={assignLoading || !facility.name}
                                                                                onClick={() => handleUnassignFacility(user.email, facility.name)}
                                                                                title="Usuń przypisanie"
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            ) : expandedUserEmail === user.email ? (
                                                                <Typography variant="body2" color="textSecondary">
                                                                    Brak przypisanych obiektów.
                                                                </Typography>
                                                            ) : null}
                                                        </Box>
                                                        <Box flex={1}>
                                                            <Typography variant="subtitle2" className="mb-2" sx={{ color: 'var(--ars-deepblue)' }}>
                                                                Wszystkie dostępne obiekty
                                                            </Typography>
                                                            {assignError && (
                                                                <Alert severity="error" className="mb-2">{assignError}</Alert>
                                                            )}
                                                            <List dense>
                                                                {allFacilities.map((facility) => {
                                                                    const alreadyAssigned = facilitiesForUser.some(f => f.name === facility.name);
                                                                    return (
                                                                        <ListItem
                                                                            key={facility.name}
                                                                            secondaryAction={
                                                                                alreadyAssigned ? (
                                                                                    <IconButton
                                                                                        edge="end"
                                                                                        color="success"
                                                                                        size="small"
                                                                                        disabled
                                                                                        title="Użytkownik już przypisany"
                                                                                    >
                                                                                        <AddIcon />
                                                                                    </IconButton>
                                                                                ) : (
                                                                                    <IconButton
                                                                                        edge="end"
                                                                                        color="primary"
                                                                                        size="small"
                                                                                        disabled={assignLoading}
                                                                                        onClick={() => handleAssignFacility(user.email, facility.name)}
                                                                                        title="Przypisz użytkownika"
                                                                                    >
                                                                                        <AddIcon />
                                                                                    </IconButton>
                                                                                )
                                                                            }
                                                                        >
                                                                            <ListItemText
                                                                                primary={facility.name}
                                                                                secondary={facility.address ? `Adres: ${facility.address}` : null}
                                                                            />
                                                                        </ListItem>
                                                                    );
                                                                })}
                                                            </List>
                                                        </Box>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        {isLoading ? 'Ładowanie...' : searchQuery ? 'Brak wyników wyszukiwania.' : 'Brak użytkowników do wyświetlenia.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {usersToDisplay.length > 0 && (
                    <Box p={2} borderTop={1} borderColor="divider" textAlign="right">
                        Liczba użytkowników: {usersToDisplay.length}
                        {searchQuery && users.length > usersToDisplay.length && (
                            <span className="ml-2 text-ars-darkgrey">(z {users.length} wszystkich)</span>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Add User Dialog */}
            <Dialog open={openAddUserDialog} onClose={handleCloseAddUserDialog}>
                <DialogTitle className="text-ars-deepblue">Dodaj Nowego Użytkownika</DialogTitle>
                <DialogContent>
                    <DialogContentText className="mb-4">
                        Wprowadź dane nowego użytkownika. Hasło powinno być bezpieczne.
                    </DialogContentText>
                    {error && <Alert severity="error" className="mb-2">{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        name="email"
                        label="Adres Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={newUser.email}
                        onChange={handleNewUserChange}
                        className="mb-4"
                    />
                    <TextField
                        margin="dense"
                        name="password"
                        label="Hasło"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        className="mb-4"
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="add-access-level-label">Poziom Dostępu</InputLabel>
                        <Select
                            labelId="add-access-level-label"
                            name="access_level"
                            value={newUser.access_level}
                            label="Poziom Dostępu"
                            onChange={handleNewUserChange}
                        >
                            <MenuItem value={1}>{getAccessLevelName(1)}</MenuItem>
                            <MenuItem value={2}>{getAccessLevelName(2)}</MenuItem>
                            <MenuItem value={3}>{getAccessLevelName(3)}</MenuItem>
                            <MenuItem value={4}>{getAccessLevelName(4)}</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseAddUserDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={isLoading}
                        sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Dodaj Użytkownika'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Dialog */}
            {userToEdit && (
                <Dialog open={openEditUserDialog} onClose={handleCloseEditUserDialog}>
                    <DialogTitle className="text-ars-deepblue">Edytuj Dane Użytkownika</DialogTitle>
                    <DialogContent>
                        <DialogContentText className="mb-4">
                            Zmień dane użytkownika <Typography component="span" fontWeight="bold">{userToEdit.email}</Typography>.
                            <br />
                            <Typography component="span" variant="caption">Adres email nie może być zmieniony.</Typography>
                        </DialogContentText>
                        {error && <Alert severity="error" className="mb-2">{error}</Alert>}
                        <TextField
                            // autoFocus // Usunięto autoFocus, aby nie kierować na nieedytowalne pole
                            margin="dense"
                            name="email"
                            label="Adres Email (nieedytowalny)"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={userToEdit.email} // Wyświetlamy email z userToEdit
                            disabled // Pole email jest wyłączone
                            className="mb-4"
                        />
                        <TextField
                            autoFocus // Przeniesiono autoFocus na pierwsze edytowalne pole
                            margin="dense"
                            name="newPassword"
                            label="Nowe Hasło (pozostaw puste, aby nie zmieniać)"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={editedUser.newPassword}
                            onChange={handleEditedUserChange}
                            className="mb-4"
                        />
                        <FormControl fullWidth margin="dense" className="mb-4">
                            <InputLabel id="edit-access-level-label">Poziom Dostępu</InputLabel>
                            <Select
                                labelId="edit-access-level-label"
                                name="access_level"
                                value={editedUser.access_level}
                                label="Poziom Dostępu"
                                onChange={handleEditedUserChange}
                            >
                                <MenuItem value={1}>{getAccessLevelName(1)}</MenuItem>
                                <MenuItem value={2}>{getAccessLevelName(2)}</MenuItem>
                                <MenuItem value={3}>{getAccessLevelName(3)}</MenuItem>
                                <MenuItem value={4}>{getAccessLevelName(4)}</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Opcjonalnie: Przełącznik is_active, jeśli /update_user go obsługuje */}
                        {/* <FormControlLabel control={<Switch checked={editedUser.is_active} onChange={handleEditedUserChange} name="is_active" />} label="Aktywny" /> */}

                    </DialogContent>
                    <DialogActions className="p-4">
                        <Button onClick={handleCloseEditUserDialog} sx={{ color: 'var(--ars-darkgrey)' }}>Anuluj</Button>
                        <Button
                            onClick={handleUpdateUser}
                            variant="contained"
                            disabled={isLoading}
                            sx={{ backgroundColor: 'var(--ars-lightblue)', '&:hover': { backgroundColor: 'var(--ars-deepblue)' } }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Zapisz Zmiany'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Confirm Dialog */}
            <Dialog open={openDeleteConfirmDialog} onClose={handleCloseDeleteConfirmDialog}>
                <DialogTitle id="alert-dialog-title" className="text-ars-deepblue">Potwierdzenie Usunięcia</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Czy na pewno chcesz usunąć użytkownika <Typography component="span" fontWeight="bold">{userToDelete?.email}</Typography>? Tej operacji nie można cofnąć.
                    </DialogContentText>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleCloseDeleteConfirmDialog} sx={{ color: 'var(--ars-darkgrey)' }}>
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleDeleteUser}
                        color="error"
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            backgroundColor: '#c82333', // Domyślny kolor tła (czerwony, który był na hover)
                            color: 'white', // Domyślny kolor tekstu
                            '&:hover': {
                                backgroundColor: '#a71d2a', // Ciemniejszy czerwony dla efektu hover
                            }
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Usuń'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminAccountsPage;