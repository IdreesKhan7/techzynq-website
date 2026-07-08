const db = require('./db');
const { v4: uuidv4 } = require('uuid');

function addSubscriber(email) {
  const existing = db.get('subscribers').find({ email }).value();
  if (existing) return { created: false, subscriber: existing };
  const sub = { id: uuidv4(), email, subscribedAt: new Date().toISOString() };
  db.get('subscribers').push(sub).write();
  return { created: true, subscriber: sub };
}

function getAllSubscribers() {
  return db.get('subscribers').orderBy('subscribedAt', 'desc').value();
}

function getCount() {
  return db.get('subscribers').size().value();
}

module.exports = { addSubscriber, getAllSubscribers, getCount };
