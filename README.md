# Blossoming Care Admin

Data management panel for the Blossoming Care UK Territories Map. Login to manage locations (add, edit, delete), filter and search, and export/import CSV. Data is stored in Supabase and consumed by the map via API.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Supabase** for database, auth, and API
- **Tailwind CSS** for styling
- **Radix UI** (Dialog, Select) for modals and dropdowns

## Deployment

Set these env vars (must match the map for changes to appear):

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key
