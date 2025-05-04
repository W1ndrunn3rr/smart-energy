# Smart Energy API - Testy jednostkowe

Ten zestaw testów zapewnia kompleksowe pokrycie testami jednostkowymi i integracyjnymi dla Smart Energy API. Testy zostały zaprojektowane do weryfikacji funkcjonalności, wydajności i odporności na błędy API do zarządzania odczytami energii, licznikami, obiektami i użytkownikami.

## Struktura testów

Testy podzielone są na cztery moduły:

1. **test_smart_energy_api.py** - podstawowe testy jednostkowe dla każdego endpointu API
2. **test_models.py** - testy sprawdzające poprawność modeli Pydantic API
3. **test_dependencies.py** - testy sprawdzające obsługę zależności i przypadków błędów
4. **conftest.py** - wspólne konfiguracje i fixtures dla testów

## Uruchomienie testów

Aby uruchomić wszystkie testy:

```bash
pytest -v
```

Aby uruchomić konkretny zestaw testów:

```bash
pytest test_smart_energy_api.py -v
pytest test_integration.py -v
```

Aby wygenerować raport pokrycia testami:

```bash
pytest --cov=app
```

## Kluczowe funkcjonalności testowane

### Odczyty (Readings)
- Tworzenie, aktualizacja i usuwanie odczytów
- Pobieranie odczytów według obiektu i typu licznika
- Walidacja danych odczytu

### Liczniki (Meters)
- Dodawanie, aktualizacja i usuwanie liczników
- Pobieranie liczników według obiektu i typu
- Obsługa błędów dla nieprawidłowych danych licznika

### Obiekty (Facilities)
- Dodawanie, aktualizacja i usuwanie obiektów
- Przypisywanie i usuwanie przypisań użytkowników do obiektów
- Pobieranie obiektów dla określonego użytkownika

### Użytkownicy (Users)
- Dodawanie, aktualizacja i usuwanie użytkowników
- Pobieranie danych użytkownika
- Blokowanie użytkowników

### Testy integracyjne
- Kompletny przepływ: od utworzenia użytkownika do wykonania odczytu
- Pełny cykl CRUD dla licznika
- Przypisanie wielu użytkowników do jednego obiektu
- Blokowanie użytkownika i weryfikacja dostępu

### Testy wydajności
- Czas odpowiedzi API
- Efektywność wywołań bazodanowych
- Zachowanie przy dużej liczbie operacji

## Mockowanie bazy danych

Testy wykorzystują `unittest.mock` do symulowania operacji bazodanowych, co pozwala na:
- Izolację testów API od rzeczywistej bazy danych
- Kontrolowanie odpowiedzi zwracanych przez bazę danych
- Symulowanie różnych scenariuszy, w tym błędów bazodanowych
- Weryfikację prawidłowego wywoływania metod bazodanowych

## Rozszerzanie testów

Przy dodawaniu nowych funkcjonalności do API, należy również dodać odpowiednie testy:

1. Jednostkowe dla nowych endpointów w `test_smart_energy_api.py`
2. Walidacyjne dla nowych modeli w `test_models.py`
3. Integracyjne dla nowych przepływów pracy w `test_integration.py`
4. Wydajnościowe dla nowych operacji w `test_performance.py`