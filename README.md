# Ma quanto mi costi?!

Tracker personale (privato) per costi veicolo con stack **Vite + React + TypeScript + Tailwind + Supabase**.

## Requisiti
- Repository GitHub **privato**
- Frontend su **Netlify**
- Backend/database su **Supabase**
- Nessun servizio Google

## 1) Setup locale
```bash
npm install
cp .env.example .env
npm run dev
```

Configura nel file `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2) Setup Supabase
1. Crea un nuovo progetto su Supabase.
2. In **Authentication > Providers**, abilita Email/Password.
3. In **SQL Editor**, esegui il file `supabase/schema.sql`.
4. Verifica che RLS sia attivo su tutte le tabelle (`veicoli`, `rifornimenti`, `spese`).

## 3) Eseguire `schema.sql`
Copia/incolla il contenuto di:
- `supabase/schema.sql`

nel SQL Editor Supabase e premi **Run**.

## 4) Deploy su Netlify
1. Collega il repository GitHub privato a Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

## Note sicurezza
- La anon key Supabase è usata nel frontend per design.
- Accesso ai dati protetto via **Supabase Auth + Row Level Security**.
- Ogni query è limitata a `user_id = auth.uid()`.

## Funzionalità

### Gestione veicoli
- Creazione, modifica e cancellazione veicoli
- Campi principali: nome, marca, modello, tipo veicolo, tipo energia, unità predefinita, odometro iniziale, data acquisto, note

### Rifornimenti e ricariche
- Inserimento e modifica completa rifornimenti/ricariche
- Calcolo automatico tra `quantita`, `prezzo_unitario` e `costo_totale`
- Supporto unità `L` e `kWh`

### Spese
- Inserimento, modifica e cancellazione spese
- Categorie supportate (es. manutenzione, assicurazione, bollo, ecc.)
- Campi opzionali: descrizione, odometro, note

### Dashboard
- Totale anno
- Costo medio mensile
- Costo/km
- Veicolo più costoso
- Ultimo rifornimento e ultima spesa
- Efficienza media per veicolo (`km/L` o `km/kWh`)

### Report / Grafici
- Costo per veicolo
- Costo per categoria
- Andamento mensile
- Efficienza media

### Filtri avanzati
- Filtro per veicolo
- Filtro data inizio / data fine
- Filtro categoria (spese)
- Report e liste aggiornati in base ai filtri

## Export / Import dati

### Export CSV
- Export separato per:
  - veicoli
  - rifornimenti
  - spese
- Separatore CSV usato: `;` (compatibile Excel italiano)

### Import CSV
- Import separato per:
  - veicoli
  - rifornimenti
  - spese
- Validazione dati prima dell'import (header, date, numeri, categorie)
- Supporto numeri con virgola italiana
- **Non cancella** dati esistenti
- **Non sovrascrive** dati esistenti

### Backup JSON
- Esportazione backup completo con:
  - veicoli
  - rifornimenti
  - spese

### Ripristino JSON
- Import da file backup JSON
- Mantiene i dati già presenti (nessun reset automatico)
- `user_id` del file **non viene usato**
- Ogni record ripristinato usa il `user_id` dell'utente autenticato

## Privacy
- Accesso protetto da **Supabase Auth** (email/password)
- Isolamento dati garantito da **Row Level Security (RLS)**
- Ogni utente vede solo i propri dati
- Nessun servizio Google
- Nessuna API esterna
