# e-Town Panchayat Digital Administration

Local web app for Town Panchayat financial transaction management. Data is stored in a **local SQLite database** (`panchayat.db`) and persists across restarts and page refreshes.

## Features

- **Secure login** – Passwords hashed with bcrypt; session tokens for API access
- **SQLite database** – Local file `panchayat.db`; no external database server
- **REST API** – `POST /api/auth/login`, `GET/POST /api/transactions` with Bearer token
- **Triplicate Challan** – Record remitter, amount, mode (Cash/Online/Cheque), date; history table with “Recorded by”

## Setup

```bash
npm install
npm start
```

Open **http://localhost:3000/login.html** in your browser.

**Default login:** `admin` / `admin123`

## Usage

1. Log in with admin / admin123 (or add users in the database).
2. Open **Accounts** → **Open Transactions**.
3. Fill the form and click **Save** – data is stored in SQLite and survives refresh.
4. Use **Refresh History** to reload the table.

## API

- `POST /api/auth/login` – Body: `{ "userId", "password" }` → `{ "token", "username" }`
- `POST /api/auth/logout` – Header: `Authorization: Bearer <token>`
- `GET /api/transactions` – Header: `Authorization: Bearer <token>` → array of transactions
- `POST /api/transactions` – Header: `Authorization: Bearer <token>`, Body: `{ "name", "amount", "mode", "date" }`

All transaction APIs require a valid login token.
