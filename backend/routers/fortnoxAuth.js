import { Router } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';

const router = Router();

function getConfig() {
  const clientId = process.env.FORTNOX_CLIENT_ID || process.env.FORTNOX_CLIENTID || process.env.FORTNOX_CLIENT_ID_WEB;
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET || process.env.FORTNOX_CLIENTSECRET;
  const redirectUri = process.env.FORTNOX_REDIRECT_URI || process.env.FORTNOX_REDIRECTURL || process.env.FORTNOX_REDIRECT_URL;
  const scopes = 'salary';
  const accountType = (process.env.FORTNOX_ACCOUNT_TYPE || 'service').toLowerCase();
  return { clientId, clientSecret, redirectUri, scopes, accountType };
}

function getSessionStore(req) {
  if (!req.session) {
    throw new Error('Session middleware not configured');
  }
  if (!req.session.fortnoxAuth) {
    req.session.fortnoxAuth = {
      tokens: null,
    };
  }
  return req.session.fortnoxAuth;
}

function getGlobalStates() {
  if (!global.fortnoxStates) {
    global.fortnoxStates = new Set();
  }
  return global.fortnoxStates;
}

function buildAuthorizeUrl({ clientId, redirectUri, scopes, state, accountType }) {
  const base = process.env.FORTNOX_AUTH_URL || 'https://apps.fortnox.se/oauth-v1/auth';
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('redirect_uri', redirectUri);
  params.set('response_type', 'code');
  params.set('scope', scopes);
  params.set('state', state);
  console.log(`buildAuthorizeUrl: ${base}?${params.toString()}`);
  if (accountType === 'service') params.set('account_type', 'service');
  
  return `${base}?${params.toString()}`;
}

async function exchangeCodeForTokens(code, redirectUri) {
  console.log("we get to the exchangeCodeForTokens");
  console.log("code: ", code);
  console.log("redirectUri: ", redirectUri);
  const { clientId, clientSecret } = getConfig();
  console.log("clientId: ", clientId);
  console.log("clientSecret: ", clientSecret);
  if (!clientId || !clientSecret || !redirectUri) {
    const missing = [!clientId && 'FORTNOX_CLIENT_ID', !clientSecret && 'FORTNOX_CLIENT_SECRET', !redirectUri && 'FORTNOX_REDIRECT_URI'].filter(Boolean).join(', ');
    throw new Error(`Missing Fortnox OAuth config: ${missing}`);
  }
  else {
    console.log("clientId and clientSecret are set");
  }

  const tokenUrl = process.env.FORTNOX_TOKEN_URL || 'https://apps.fortnox.se/oauth-v1/token';
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('redirect_uri', redirectUri);

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body,
  });
  console.log("TOKEN res: ", res);

  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }
  if (!res.ok) {
    const errMsg = (json && (json.error_description || json.error)) || text || `HTTP ${res.status}`;
    const e = new Error(`Fortnox token exchange failed: ${errMsg}`);
    e.status = res.status; e.response = json || text; throw e;
  }

  const accessToken = json && (json.access_token || json.accessToken);
  const refreshToken = json && (json.refresh_token || json.refreshToken);
  const expiresIn = Number(json && json.expires_in) || 3600;
  const now = Date.now();
  const expiresAt = now + (expiresIn * 1000) - 60000;
  return { accessToken, refreshToken, expiresAt, raw: json };
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing client credentials or refresh token');
  }
  const tokenUrl = process.env.FORTNOX_TOKEN_URL || 'https://apps.fortnox.se/oauth-v1/token';
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', refreshToken);

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body,
  });

  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }
  if (!res.ok) {
    const errMsg = (json && (json.error_description || json.error)) || text || `HTTP ${res.status}`;
    const e = new Error(`Fortnox token refresh failed: ${errMsg}`);
    e.status = res.status; e.response = json || text; throw e;
  }

  const accessToken = json && (json.access_token || json.accessToken);
  const newRefreshToken = (json && (json.refresh_token || json.refreshToken)) || refreshToken;
  const expiresIn = Number(json && json.expires_in) || 3600;
  const now = Date.now();
  const expiresAt = now + (expiresIn * 1000) - 60000;
  return { accessToken, refreshToken: newRefreshToken, expiresAt, raw: json };
}

router.get('/login', (req, res) => {
  const { clientId, redirectUri, scopes, accountType } = getConfig();
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Configure FORTNOX_CLIENT_ID and FORTNOX_REDIRECT_URI' });
  }
  const chosenAccountType = (req.query && typeof req.query.accountType === 'string' && req.query.accountType.trim()) || accountType;
  const state = crypto.randomBytes(16).toString('hex');
  const url = buildAuthorizeUrl({ clientId, redirectUri, scopes, state, accountType: chosenAccountType });
  const states = getGlobalStates();
  states.add(state);
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  console.log("we get to the callback");
  console.log("req.query: ", req.query);
  const { redirectUri } = getConfig();
  const code = req.query && req.query.code;
  const state = req.query && req.query.state;
  const oauthError = req.query && (req.query.error || req.query.error_description);
  console.log("oauthError: ", oauthError);
  const states = getGlobalStates();

  // Frontend redirect URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (oauthError) {
    // Redirect to frontend with error
    return res.redirect(`${frontendUrl}/?auth=error&message=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    return res.redirect(`${frontendUrl}/?auth=error&message=${encodeURIComponent('Missing authorization code')}`);
  }
  if (!state || !states.has(state)) {
    return res.redirect(`${frontendUrl}/?auth=error&message=${encodeURIComponent('Invalid state parameter')}`);
  }
  states.delete(state);

  try {
    console.log("we get to the try exchangeCodeForTokens");
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const store = getSessionStore(req);
    store.tokens = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
    // Redirect to frontend with success
    res.redirect(`${frontendUrl}/?auth=success`);
  } catch (e) {
    // Redirect to frontend with error
    const errorMessage = e.message || 'Authentication failed';
    res.redirect(`${frontendUrl}/?auth=error&message=${encodeURIComponent(errorMessage)}`);
  }
});

router.post('/refresh', async (req, res) => {
  const store = getSessionStore(req);
  const current = store.tokens;
  if (!current || !current.refreshToken) {
    return res.status(400).json({ error: 'No refresh token available. Authorize first.' });
  }
  try {
    const tokens = await refreshAccessToken(current.refreshToken);
    store.tokens = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
    res.json({ refreshed: true, expiresAt: tokens.expiresAt });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.response });
  }
});

router.get('/status', (req, res) => {
  const store = getSessionStore(req);
  const tokens = store.tokens;
  const now = Date.now();
  const hasAccess = Boolean(tokens && tokens.accessToken);
  const expiresAt = tokens && tokens.expiresAt ? tokens.expiresAt : null;
  const expiresInMs = expiresAt ? Math.max(0, expiresAt - now) : null;
  res.json({ authorized: hasAccess, expiresAt, expiresInMs });
});

export default router;

export async function getOrRefreshAccessTokenFromSession(req) {
  if (!req || !req.session) return null;
  const store = getSessionStore(req);
  if (!store || !store.tokens) return null;
  const now = Date.now();
  const t = store.tokens;
  if (t.expiresAt && t.expiresAt > now && t.accessToken) {
    return t.accessToken;
  }
  if (!t.refreshToken) return null;
  try {
    const refreshed = await refreshAccessToken(t.refreshToken);
    store.tokens = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    };
    return refreshed.accessToken || null;
  } catch (_) {
    return null;
  }
}

router.post('/logout', (req, res) => {
  try {
    if (req.session && req.session.fortnoxAuth) {
      delete req.session.fortnoxAuth;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


