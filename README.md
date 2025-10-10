# DH2465 - Development Setup

## 🔓 Disabling Authentication for Development

To test the application without authentication, create a `.env` file in the `frontend/` directory:

```bash
cd frontend
touch .env
```

Add this line to `frontend/.env`:

```env
VITE_DISABLE_AUTH=true
```

### What this does:

- **Bypasses login/register pages** - You won't need to create an account or log in
- **Skips authentication checks** - All protected routes become accessible
- **Enables immediate testing** - You can access all application features right away

⚠️ **Important**: Only use this in development. Never set this to `true` in production.

### To re-enable authentication:

Change the value to `false` or remove the line entirely:

```env
VITE_DISABLE_AUTH=false
```