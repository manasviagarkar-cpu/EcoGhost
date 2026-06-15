require('dotenv').config();
const admin = require('firebase-admin');

// ── Firebase Admin initialization ──────────────────────────────────────
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`[EcoGhost] Server listening on port ${PORT}`);
  console.log(`[EcoGhost] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
