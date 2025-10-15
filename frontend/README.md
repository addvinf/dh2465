# DH2465 - Frontend Development Setup

## 🔓 Disabling Authentication for Development

To test the application without authentication, you need to configure both frontend and backend:

### Frontend Setup

Create a `.env` file in this directory:

```bash
touch .env
```

Add this line to `.env`:

```env
VITE_DISABLE_AUTH=true
```

### Backend Setup

Create a `.env` file in the `backend/` directory:

```bash
cd ../backend
touch .env
```

Add these lines to `backend/.env`:

```env
DISABLE_AUTH=true
SESSION_SECRET=your-generated-secret-here
```

**Generate a secure session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and replace `your-generated-secret-here` with the generated value.

### What this does:

- **Frontend**: Bypasses login/register pages and skips authentication checks
- **Backend**: Makes all protected API routes accessible without JWT tokens
- **Result**: You can access all application features immediately without logging in

⚠️ **Important**: Only use this in development. Never set this to `true` in production.

### To re-enable authentication:

Change both values to `false` or remove the lines entirely:

**Frontend `.env`:**
```env
VITE_DISABLE_AUTH=false
```

**Backend `.env`:**
```env
DISABLE_AUTH=false
```

## Development

To start the development server:

```bash
npm run dev
```
