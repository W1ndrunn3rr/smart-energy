# smart-energy
SiteFlow - płynne zarządzanie obiektami, SmartEnergy 


## 1. Jak odpalić dev server ?
```bash
make run
```

## 2.Jak zastopować dev server ?
- CTRL + C -> do zastopowania 
-  ``` make stop``` -> stopuje i czyści kontenery z pamięci

## 3.Jak stworzyć PR ? 
- a) tworzymy nową gałąź :
```bash
git checkout -b tag/feature
```
Tag -> frontend/backend

Feature -> np. menu, dropbar, licznik itd.

- b) dodajemy zmiany
```bash
git add
```

- c) commitujemy zmiany
```bash
git commit -m "opis zmiany"
```

- d) pushujemy zmiany z brancha
```bash
git push main nazwa_brancha
```

- d) tworzymy PR na githubie z naszym branchem i czekamy na zatwierdzenie 

- *e) opcjonalnie switchujemy z powrotem na maina
```bash
git checkout main
```



