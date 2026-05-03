# API & Data Flow

## Scrittura

- Veicolo → insert veicoli
- Rifornimento → insert rifornimenti
- Spesa → insert spese

## Lettura

- select * from veicoli where user_id = auth.uid()

## Filtri
- per veicolo
- per data
- per categoria

## Aggregazioni (client-side)
- totale anno
- costo medio mensile
- costo/km
- costo per veicolo
- efficienza

## Regola
- ZERO logica nel database
- Tutto calcolato nel frontend