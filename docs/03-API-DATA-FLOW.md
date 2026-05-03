# API & Data Flow

## Scrittura

- Veicolo → insert veicoli
- Rifornimento → insert rifornimenti
- Spesa → insert spese

## Lettura

- select * from veicoli where user_id = auth.uid()

## Filtri
- per veicolo
- per data (inizio/fine)
- per categoria (spese)

## Aggregazioni (client-side)
- totale anno
- costo medio mensile
- costo/km
- costo per veicolo
- efficienza

## Export/Import

### CSV Export
- Veicoli: nome,marca,modello,tipo_veicolo,tipo_energia,unita_default,odometro_iniziale,data_acquisto,note
- Rifornimenti: veicolo_nome,data,odometro,quantita,unita,prezzo_unitario,costo_totale,fornitore,note
- Spese: veicolo_nome,data,categoria,descrizione,importo,odometro,note

### CSV Import
- Separatore: `;`
- Supporto campi tra virgolette
- Conversione numeri con virgola italiana
- Validazione dati prima dell'import
- Nessun overwrite automatico
- Collegamento tramite veicolo_nome

### Backup JSON
- Formato: {versione, dataEsportazione, veicoli[], rifornimenti[], spese[]}
- Ripristino mantiene dati esistenti
- Forza user_id dell'utente loggato

## Regola
- ZERO logica nel database
- Tutto calcolato nel frontend
- Privacy: dati solo per utente autenticato