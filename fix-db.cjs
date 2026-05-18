const Database = require('better-sqlite3');
const db = new Database('app.db');

// Add deactivated workspace for u7
db.prepare('INSERT OR IGNORE INTO workspaces (id, name, owner_id, subscription_plan, is_deactivated) VALUES (?, ?, ?, ?, ?)').run('w2', 'FreshMart Europe (Deactivated)', 'u7', 'Pro', 1);

console.log('Added deactivated workspace');
