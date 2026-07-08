const low  = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../data/db.json'));
const db = low(adapter);

// Default schema
db.defaults({
  articles:    [],
  messages:    [],
  subscribers: [],
}).write();

module.exports = db;
