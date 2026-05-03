# Architettura (CORE)

## Stack
- Frontend: React (SPA)
- Backend: Supabase (DB + Auth + API)
- Hosting: Netlify
- Repository: GitHub

## Architettura generale

UI (React)
↓
Supabase Client
↓
Database (PostgreSQL)

- Nessun backend custom
- Tutta la logica passa da Supabase

## Flusso dati

### Inserimento
Form → Supabase insert → DB

### Lettura
Supabase select → React state → UI

### Calcoli
- Lato client (React)
- Nessuna logica nel DB

## Autenticazione
- Supabase Auth (email/password)
- Sessione client
- Tutti i record hanno `user_id`

## Privacy
- Nessuna integrazione esterna
- Tutti i dati su Supabase
- Accesso isolato per utente