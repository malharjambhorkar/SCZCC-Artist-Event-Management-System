# Cultural Art Zone

Full-stack artist, event, venue, and expense management system with role-based access for `admin`, `clerk`, and `artist`.

## Structure

```text
caz/
  backend/
    src/
      config/
      controllers/
      middleware/
      routes/
      utils/
  frontend/
    src/
      components/
        common/
      context/
      features/
      pages/
      utils/
```

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL

## Backend Setup

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=caz_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=change_this_secret
PORT=5000
```

Install and start:

```powershell
cd backend
npm install
npm run db:init
npm run dev
```

If the database does not exist yet:

```sql
CREATE DATABASE caz_db;
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

## Demo Credentials

- Admin: `admin@culturalzone.com` / `admin123`
- Clerk: `clerk@culturalzone.com` / `clerk123`
- Artist: `john@example.com` / `password123`

## Notes

- `npm run db:init` is safe to rerun for schema updates.
- Shared UI lives under `frontend/src/components/common`.
- Reusable domain-specific UI and helpers live under `frontend/src/features`.
- Backend controller helpers live under `backend/src/utils`.
