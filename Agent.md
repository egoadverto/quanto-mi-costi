# Project Owner Instructions

The project owner is not a programmer.

Always:
- explain changes in simple language
- avoid unnecessary abstractions
- prefer fewer files and boring code
- ask before deleting important files
- show exact terminal commands when terminal work is required
- explain where each file is located
- never assume the owner understands framework internals

Development rules:
- do not over-engineer
- do not add dependencies unless necessary
- keep architecture simple
- prefer explicit code over clever code
- document every setup step in README.md
- always keep the app buildable
- make small incremental changes
- avoid large rewrites
- do not create complex Git workflows unless explicitly requested

Project: Ma quanto mi costi?!

This is a personal-use vehicle cost tracking app.

Hard constraints:
- personal-use only
- not a SaaS
- not a commercial product
- use GitHub, Netlify and Supabase only
- no Google services
- no Google Sheets
- no Google Drive
- no Apps Script
- no external APIs unless explicitly approved
- privacy is a primary requirement
- keep the codebase simple and maintainable

Stack:
- React
- TypeScript
- Supabase
- Netlify
- GitHub

Data rules:
- vehicle data belongs only to the authenticated user
- Supabase Row Level Security must protect user data
- do not expose service role keys
- do not add multi-tenant/company/team/organization concepts
- do not invent new database fields without explicit approval

App features:
- vehicles
- rifornimenti / ricariche
- spese
- dashboard
- report
- simple personal statistics

UI rules:
- Italian UI
- clear labels
- clear helper text
- mobile-first layout
- keep forms simple
- avoid unnecessary animations or visual complexity

When modifying the project:
1. State what files will be changed.
2. Make the smallest safe change.
3. Run the build.
4. Fix build errors before finishing.
5. Summarize the result in plain language.