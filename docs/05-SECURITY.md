# Security & Privacy

## Regola principale
Ogni utente vede solo i suoi dati

## RLS (Row Level Security)

### SELECT
user_id = auth.uid()

### INSERT
user_id = auth.uid()

### UPDATE
user_id = auth.uid()

### DELETE
user_id = auth.uid()

## Storage
- Privato
- Accesso via signed URL

## Vincoli
- Nessuna API esterna
- Nessuna integrazione Google