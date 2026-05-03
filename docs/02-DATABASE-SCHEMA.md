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
- data_creazione (TIMESTAMP)

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
- No cascade delete