const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'tickets.db'));

function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_counters (
      guild_id TEXT PRIMARY KEY,
      last_ticket_number INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (guild_id) REFERENCES ticket_counters (guild_id)
    );

    CREATE TABLE IF NOT EXISTS ticket_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      added_by TEXT NOT NULL,
      reason TEXT,
      added_at INTEGER NOT NULL,
      UNIQUE(guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      admin_role_id TEXT,
      created_at INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function getNextTicketNumber(guildId) {
  const row = db
    .prepare("SELECT last_ticket_number FROM ticket_counters WHERE guild_id = ?")
    .get(guildId);
  
  if (!row) {
    db.prepare("INSERT INTO ticket_counters (guild_id, last_ticket_number) VALUES (?, 1)")
      .run(guildId);
    return 1;
  } else {
    const nextNum = row.last_ticket_number + 1;
    db.prepare("UPDATE ticket_counters SET last_ticket_number = ? WHERE guild_id = ?")
      .run(nextNum, guildId);
    return nextNum;
  }
}

function addTicket(guildId, channelId, userId) {
  const now = Date.now();
  db.prepare("INSERT INTO tickets (guild_id, channel_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .run(guildId, channelId, userId, now);
}

function removeTicket(channelId) {
  db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channelId);
}

function getTicketByChannel(channelId) {
  return db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channelId);
}

function getTicketByUser(guildId, userId) {
  return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ?").get(guildId, userId);
}

function addToBlacklist(guildId, userId, addedBy, reason = null) {
  const now = Date.now();
  try {
    db.prepare("INSERT INTO ticket_blacklist (guild_id, user_id, added_by, reason, added_at) VALUES (?, ?, ?, ?, ?)")
      .run(guildId, userId, addedBy, reason, now);
    return true;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return false;
    }
    throw error;
  }
}

function removeFromBlacklist(guildId, userId) {
  const result = db.prepare("DELETE FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?")
    .run(guildId, userId);
  return result.changes > 0;
}

function isBlacklisted(guildId, userId) {
  const row = db.prepare("SELECT * FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
  return row !== undefined;
}

function getBlacklistedUsers(guildId) {
  return db.prepare("SELECT * FROM ticket_blacklist WHERE guild_id = ? ORDER BY added_at DESC")
    .all(guildId);
}

function setAdminRole(guildId, roleId) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO guild_settings (guild_id, admin_role_id, created_at) 
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET admin_role_id = ?
  `).run(guildId, roleId, now, roleId);
}

function getAdminRole(guildId) {
  const row = db.prepare("SELECT admin_role_id FROM guild_settings WHERE guild_id = ?")
    .get(guildId);
  return row ? row.admin_role_id : null;
}

module.exports = {
  setupDatabase,
  getNextTicketNumber,
  addTicket,
  removeTicket,
  getTicketByChannel,
  getTicketByUser,
  addToBlacklist,
  removeFromBlacklist,
  isBlacklisted,
  getBlacklistedUsers,
  setAdminRole,
  getAdminRole
};