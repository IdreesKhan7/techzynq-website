const db = require('./db');
const { v4: uuidv4 } = require('uuid');

function createMessage(data) {
  const msg = {
    id:          uuidv4(),
    name:        data.name,
    email:       data.email,
    reason:      data.reason || 'General',
    message:     data.message,
    submittedAt: new Date().toISOString(),
    read:        false,
  };
  db.get('messages').push(msg).write();
  return msg;
}

function getAllMessages() {
  return db.get('messages').orderBy('submittedAt', 'desc').value();
}

function markRead(id) {
  db.get('messages').find({ id }).assign({ read: true }).write();
}

function deleteMessage(id) {
  db.get('messages').remove({ id }).write();
}

function getUnreadCount() {
  return db.get('messages').filter({ read: false }).size().value();
}

module.exports = { createMessage, getAllMessages, markRead, deleteMessage, getUnreadCount };
