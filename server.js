const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDB, initDb, saveDb } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const sessions = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  req.user = sessions.get(token);
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body || {};
  if (!userId || !password) {
    return res.status(400).json({ message: 'User ID and Password are required.' });
  }
  const db = getDB();
  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
  stmt.bind([String(userId).trim()]);
  let user = null;
  if (stmt.step()) user = stmt.getAsObject();
  stmt.free();
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid User ID or Password.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, username: user.username });
  return res.json({ token, username: user.username });
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  return res.json({ message: 'Logged out.' });
});

app.get('/api/transactions', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const stmt = db.prepare(
      'SELECT id, name, amount, mode, date, created_by, created_at FROM transactions ORDER BY created_at DESC'
    );
    const list = [];
    while (stmt.step()) list.push(stmt.getAsObject());
    stmt.free();
    return res.json(list);
  } catch (err) {
    console.error('List transactions error:', err);
    return res.status(500).json({ message: 'Failed to load transactions.' });
  }
});

app.post('/api/transactions', requireAuth, (req, res) => {
  const { name, amount, mode, date } = req.body || {};
  if (!name || amount === undefined || amount === null || amount === '' || !mode || !date) {
    return res.status(400).json({ message: 'Please provide all fields: name, amount, mode, date.' });
  }
  try {
    const db = getDB();
    db.run(
      'INSERT INTO transactions (name, amount, mode, date, created_by) VALUES (?, ?, ?, ?, ?)',
      [
        String(name).trim(),
        String(amount).trim(),
        String(mode).trim(),
        String(date).trim(),
        req.user.username
      ]
    );
    saveDb();
    return res.json({ message: 'Transaction saved successfully.' });
  } catch (err) {
    console.error('Save transaction error:', err);
    return res.status(500).json({ message: 'Failed to save transaction.' });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`e-Town Panchayat running at http://localhost:${port}`);
      console.log('Default login: admin / admin123');
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
