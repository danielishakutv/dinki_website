/**
 * Integration example — how to wire emailService into your existing auth controller
 * 
 * This shows the changes needed in your backend auth routes/controllers.
 * Adapt to match your actual file structure.
 * 
 * Drop into: backend/src/services/emailIntegration.example.js (reference only)
 */

// ─────────────────────────────────────────────
// In your auth controller (e.g. src/controllers/authController.js)
// where you handle POST /auth/signup:
// ─────────────────────────────────────────────

const { sendOTP, sendWelcome, sendPasswordReset } = require('../services/emailService');

// In the signup handler, AFTER generating the OTP and saving to DB:
async function signupHandler(req, res) {
  // ... your existing signup logic ...
  // ... generate OTP, save user, save OTP to DB/Redis ...

  // REPLACE: console.log('OTP:', otp)
  // WITH:
  try {
    await sendOTP(email, otp, name);
  } catch (err) {
    // Don't fail signup if email fails — OTP is in DB, user can request resend
    console.error('[AUTH] Failed to send OTP email:', err.message);
  }

  // ... return response ...
}


// ─────────────────────────────────────────────
// In the verify-email handler:
// ─────────────────────────────────────────────

async function verifyEmailHandler(req, res) {
  // ... your existing verify logic ...
  // ... verify OTP, activate user, generate tokens ...

  // AFTER successful verification, send welcome email (non-blocking):
  sendWelcome(user.email, user.name, user.role).catch((err) => {
    console.error('[AUTH] Failed to send welcome email:', err.message);
  });

  // ... return tokens ...
}


// ─────────────────────────────────────────────
// In the forgot-password handler:
// ─────────────────────────────────────────────

async function forgotPasswordHandler(req, res) {
  // ... your existing logic ...
  // ... generate reset token, save to DB ...

  // REPLACE: console.log('Reset token:', token)
  // WITH:
  try {
    await sendPasswordReset(email, resetToken, user.name);
  } catch (err) {
    console.error('[AUTH] Failed to send reset email:', err.message);
  }

  // Always return success (don't reveal if email exists)
  // ... return response ...
}


// ─────────────────────────────────────────────
// In your app.js / server.js startup:
// ─────────────────────────────────────────────

const { verifyConnection } = require('./services/emailService');

// Add this during server startup (after DB connection):
async function startServer() {
  // ... existing startup (DB, Redis, etc.) ...

  // Verify Postfix is reachable
  await verifyConnection();

  // ... start Express ...
}


// ─────────────────────────────────────────────
// docker-compose.yml changes needed:
// ─────────────────────────────────────────────

/*
services:
  dinki-api:
    build: ./backend
    ports:
      - "3101:3000"
    extra_hosts:
      - "host.docker.internal:host-gateway"    # <-- ADD THIS LINE
    environment:
      - EMAIL_HOST=host.docker.internal        # <-- ADD THIS
    depends_on:
      - dinki-db
      - dinki-redis
*/


// ─────────────────────────────────────────────
// backend/.env additions:
// ─────────────────────────────────────────────

/*
# Email
EMAIL_FROM="Dinki Africa" <no-reply@dinki.africa>
EMAIL_SUPPORT=support@dinki.africa
FRONTEND_URL=https://dinki.africa
*/
