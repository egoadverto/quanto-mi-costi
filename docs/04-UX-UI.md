# UX / UI Blueprint

## Macro-pagine (navigazione attuale)

### Riepilogo
- Dashboard
- Report
  - Costo per veicolo
  - Costo per categoria
  - Andamento mensile
  - Efficienza media

### Inserimento dati
- Rifornimenti: form inserimento
- Spese: form inserimento
- Veicoli: creazione/modifica completa + lista

### Riepilogo inserimenti
- Filtri avanzati:
  - Filtro veicolo
  - Data inizio / Data fine
  - Categoria (per spese)
- Lista rifornimenti filtrata
- Lista spese filtrata
- Report filtrato

## Navigazione

Riepilogo | Inserimento dati | Riepilogo inserimenti

## Backup e Ripristino
- Esporta backup JSON
- Ripristina da backup JSON
- Esporta CSV (veicoli, rifornimenti, spese)
- Importa CSV (veicoli, rifornimenti, spese)

## Regole UX
- UI semplice
- Tutti i campi con label
- Nessuna logica nascosta
- Mobile-first
- Separatore CSV: punto e virgola `;` (compatibile Excel italiano)
- Nessuna cancellazione dati durante import
- Forza user_id dell'utente autenticato