# Data Model / Schema DB

## Tabella: veicoli

- id (UUID, PK)
- user_id (UUID, NOT NULL)
- nome (TEXT, NOT NULL)
- marca (TEXT)
- modello (TEXT)
- tipo_veicolo (TEXT)
- tipo_energia (TEXT)
- unita_default (TEXT)
- odometro_iniziale (NUMERIC)
- data_acquisto (DATE)
- km_iniziali (NUMERIC)
- note (TEXT)
- data_creazione (DATE, default current_date)

---

## Tabella: rifornimenti

- id (UUID, PK)
- user_id (UUID, NOT NULL)
- veicolo_id (UUID, FK)
- data (DATE, NOT NULL)
- odometro (NUMERIC, NOT NULL)
- quantita (NUMERIC, NOT NULL)
- unita (TEXT)
- prezzo_unitario (NUMERIC, NOT NULL)
- costo_totale (NUMERIC, NOT NULL)
- fornitore (TEXT)
- note (TEXT)

---

## Tabella: spese

- id (UUID, PK)
- user_id (UUID, NOT NULL)
- veicolo_id (UUID, FK)
- data (DATE, NOT NULL)
- categoria (TEXT)
- descrizione (TEXT)
- importo (NUMERIC, NOT NULL)
- odometro (NUMERIC)
- note (TEXT)

---

## Regole
- Tutte le tabelle hanno user_id
- FK obbligatorie su veicolo
- Le FK verso `auth.users(id)` e `veicoli(id)` usano `on delete cascade`
- Se un utente viene eliminato, i suoi record vengono eliminati
- Se un veicolo viene eliminato, rifornimenti e spese collegati vengono eliminati

## Nota campi odometro
- In `veicoli` esistono sia `odometro_iniziale` sia `km_iniziali`
- La UI attuale usa `odometro_iniziale`
- `km_iniziali` e presente nello schema ma al momento non e usato nel frontend
