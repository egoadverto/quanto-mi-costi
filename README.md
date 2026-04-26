# Ma quanto mi costi?!

Tracker personale (privato) per costi veicolo con stack **Vite + React + TypeScript + Tailwind + Supabase**.
Nessun concetto SaaS multi-tenant: app pensata per uso personale.

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
- Login email/password
- Registrazione email/password
- Logout
- App protetta (senza login viene mostrata solo schermata accesso)
- CRUD veicoli, rifornimenti, spese
- Dashboard con metriche in italiano
- Layout mobile-first
