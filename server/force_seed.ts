import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('app.db');
db.pragma('journal_mode = WAL');

console.log('Starting force seed...');

db.exec('DELETE FROM tasks');
try { db.exec('DELETE FROM draft_tasks'); } catch(e){}
db.exec('DELETE FROM projects');
db.exec('DELETE FROM users');
db.exec('DELETE FROM roles');
db.exec('DELETE FROM departments');
db.exec('DELETE FROM workspaces');
db.exec('DELETE FROM invitations');
db.exec('DELETE FROM notifications');
db.exec('DELETE FROM activity_logs');
db.exec('DELETE FROM time_logs');
db.exec('DELETE FROM groups');
db.exec('DELETE FROM group_members');
db.exec('DELETE FROM messages');

const hashedPassword = bcrypt.hashSync('password123', 10);

/******************************************
 * WORKSPACES
 ******************************************/
const insertWorkspace = db.prepare('INSERT INTO workspaces (id, name, owner_id, subscription_plan, is_deactivated) VALUES (?, ?, ?, ?, ?)');
insertWorkspace.run('w_ho', 'Reliance H.O.', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_cg', 'Reliance Store - CG Road', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_sg', 'Reliance Store - SG Highway', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_wh', 'Reliance Warehouse', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_is', 'Reliance Store - Iscon', 'u1', 'Enterprise', 1);

/******************************************
 * DEPARTMENTS
 ******************************************/
const insertDept = db.prepare('INSERT INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)');
insertDept.run('d_ho', 'w_ho', 'Corporate Operations', 'u1');
insertDept.run('d_cg', 'w_cg', 'Store Front & Operations', 'u3');
insertDept.run('d_sg', 'w_sg', 'Retail Experience', 'u2');
insertDept.run('d_wh', 'w_wh', 'Warehouse Logistics', 'u4');

/******************************************
 * ROLES
 ******************************************/
const adminPerms = '["manage_members","manage_roles","manage_departments","manage_projects","view_projects","manage_tasks","create_tasks","approve_tasks","manage_chat","use_ai","view_reports","view_audit_logs","switch_workspace"]';
const mgrPerms = '["view_tasks", "create_tasks", "update_tasks", "approve_tasks"]';
const staffPerms = '["view_tasks", "update_tasks"]';

const insertRole = db.prepare('INSERT INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)');
insertRole.run('r_ho_owner', 'w_ho', 'd_ho', 'Director', adminPerms, '#4f46e5');
insertRole.run('r_cg_mgr', 'w_cg', 'd_cg', 'Store Manager', mgrPerms, '#ec4899');
insertRole.run('r_cg_staff', 'w_cg', 'd_cg', 'Counter Staff', staffPerms, '#10b981');
insertRole.run('r_sg_staff', 'w_sg', 'd_sg', 'Floor Staff', staffPerms, '#10b981');
insertRole.run('r_wh_mgr', 'w_wh', 'd_wh', 'Warehouse Manager', mgrPerms, '#f59e0b');
insertRole.run('r_wh_staff', 'w_wh', 'd_wh', 'Loader', staffPerms, '#3b82f6');

/******************************************
 * USERS
 ******************************************/
const insertUser = db.prepare('INSERT INTO users (id, workspace_id, department_id, role_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
// Owner & Admin
insertUser.run('u1', 'w_ho', 'd_ho', 'r_ho_owner', 'MS Dhoni', 'dhoni@reliance.demo', '7777777777', hashedPassword, 'Owner');
insertUser.run('u2', 'w_ho', 'd_ho', 'r_ho_owner', 'Virat Kohli', 'virat@reliance.demo', '8888888888', hashedPassword, 'Admin');

// Managers
insertUser.run('u3', 'w_cg', 'd_cg', 'r_cg_mgr', 'Rohit Sharma', 'rohit@reliance.demo', '1111111111', hashedPassword, 'Manager');
insertUser.run('u4', 'w_wh', 'd_wh', 'r_wh_mgr', 'Jasprit Bumrah', 'jasprit@reliance.demo', '2222222222', hashedPassword, 'Manager');

// Staff
insertUser.run('u5', 'w_cg', 'd_cg', 'r_cg_staff', 'Ravindra Jadeja', 'jadeja@reliance.demo', '4444444444', hashedPassword, 'Employee');
insertUser.run('u6', 'w_cg', 'd_cg', 'r_cg_staff', 'KL Rahul', 'rahul@reliance.demo', '5555555555', hashedPassword, 'Employee');
insertUser.run('u7', 'w_sg', 'd_sg', 'r_sg_staff', 'Rishabh Pant', 'rishabh@reliance.demo', '6666666666', hashedPassword, 'Employee');
insertUser.run('u8', 'w_wh', 'd_wh', 'r_wh_staff', 'Surya Kumar Yadav', 'surya@reliance.demo', '9999999999', hashedPassword, 'Employee');

// We also simulate their association across instances as members by ensuring cross-workspace groups
db.prepare("UPDATE users SET department_ids = '[\"d_ho\",\"d_cg\",\"d_sg\",\"d_wh\"]' WHERE id IN ('u1','u2')").run();

/******************************************
 * PROJECTS
 ******************************************/
const insertProject = db.prepare('INSERT INTO projects (id, workspace_id, department_id, name, description, kanban_columns) VALUES (?, ?, ?, ?, ?, ?)');
const defaultCols = JSON.stringify([
  { id: 'Todo', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Pending Approval', title: 'Review' },
  { id: 'Completed', title: 'Closed' }
]);
insertProject.run('p1', 'w_cg', 'd_cg', 'Apparel & Groceries Restock', 'Daily ops for consumer goods replenishment.', defaultCols);
insertProject.run('p2', 'w_sg', 'd_sg', 'SG Highway Grand Makeover', 'Renovation and inventory placement updates.', defaultCols);
insertProject.run('p3', 'w_wh', 'd_wh', 'Logistics Audit & Fulfillment', 'Fleet, cargo checks, and bulk delivery processes.', defaultCols);
insertProject.run('p4', 'w_ho', 'd_ho', 'Q3 Performance Strategy', 'Enterprise level sales reconciliation.', defaultCols);
insertProject.run('p5', 'w_is', 'd_cg', 'Iscon Closeout Records', 'Store decommission tasks.', defaultCols);

/******************************************
 * TASKS (FLOODING REAL-WORLD DATA)
 ******************************************/
const insertTask = db.prepare('INSERT INTO tasks (id, workspace_id, project_id, title, description, assigned_to_type, assigned_to_id, priority, status, due_date, proof_type, recurring_rule, time_spent, comments, subtasks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

const today = new Date();
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

const fmt = (d: Date) => d.toISOString().split('T')[0];

let counter = 1;

// HO Tasks
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Review Multi-City Tax Filings', 'Sign off on the Q3 GST records for CG Road and SG Highway.', 'user', 'u1', 'Critical', 'Pending Approval', fmt(today), 'Document', null, 3600, JSON.stringify([{id:'c1',text:'Tax team has uploaded records. Waiting for Dhoni signature.',author:'Virat Kohli',timestamp:fmt(today)}]), JSON.stringify([]), 'u2');
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Verify Vendor Payments (MRF, Amul)', 'Approve block-payments for logistics & food suppliers.', 'user', 'u1', 'High', 'Pending Approval', fmt(today), 'Document', null, 1800, '[]', '[]', 'u2');
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Weekly Gross Profit Sync', 'Owner review of weekly margins against Reliance retail limits.', 'user', 'u1', 'High', 'Todo', fmt(tomorrow), 'None', 'Weekly', 0, '[]', '[]', 'u2');
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Approve SG Highway Renovation Budget', 'Review the proposal for new lighting.', 'user', 'u1', 'Critical', 'Pending Approval', fmt(yesterday), 'Document', null, 1200, '[]', '[]', 'u3');
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Historical Sales Audit (2025)', 'Lookback at last year’s festive records.', 'user', 'u1', 'Medium', 'Completed', fmt(lastWeek), 'None', null, 14400, '[]', '[]', 'u1');
insertTask.run(`t${counter++}`, 'w_ho', 'p4', 'Draft Festive Supply Agreements', 'Begin negotiations for Diwali inventory limits.', 'user', 'u2', 'High', 'In Progress', fmt(nextWeek), 'None', null, 2500, '[]', '[]', 'u1');

// CG Road Tasks
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Night Shift Aisle 4 Floor Waxing', 'Clean all main arteries before weekend.', 'user', 'u5', 'Medium', 'Todo', fmt(today), 'None', 'Weekly', 0, '[]', '[]', 'u3');
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Accept Delivery of Parle-G Stock', '300 cartons arriving by 11 AM.', 'user', 'u6', 'High', 'Todo', fmt(tomorrow), 'None', null, 0, '[]', '[]', 'u3');
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Fix Defective POS Terminal #3', 'Terminal stops logging transactions.', 'user', 'u5', 'Critical', 'In Progress', fmt(today), 'Image', null, 1200, '[]', '[]', 'u3');
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Approve Floor Layout Mod', 'Rohit needs to approve end-cap display rotation.', 'user', 'u3', 'High', 'Pending Approval', fmt(today), 'Image', null, 0, JSON.stringify([{id:'cxs',text:'Created the end-cap structure.',author:'KL Rahul',timestamp:fmt(today)}]), '[]', 'u6');
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Daily Registers Cash Audit', 'Count drawers and place in safe.', 'user', 'u6', 'High', 'Completed', fmt(yesterday), 'None', 'Daily', 900, '[]', '[]', 'u3');
insertTask.run(`t${counter++}`, 'w_cg', 'p1', 'Quarterly Inventory Audit', 'Count stock remaining vs database.', 'user', 'u3', 'High', 'Completed', fmt(lastWeek), 'None', null, 18000, '[]', '[]', 'u1');

// SG Highway Tasks
insertTask.run(`t${counter++}`, 'w_sg', 'p2', 'Mount Wall Displays', 'Install the relocated Iscon shelves securely.', 'user', 'u7', 'High', 'In Progress', fmt(tomorrow), 'Image', null, 5600, '[]', '[]', 'u2');
insertTask.run(`t${counter++}`, 'w_sg', 'p2', 'Staff Fire Drill Training', 'Run the mandatory fire drill.', 'user', 'u7', 'Medium', 'Completed', fmt(twoDaysAgo), 'None', 'Monthly', 3600, '[]', '[]', 'u2');
insertTask.run(`t${counter++}`, 'w_sg', 'p2', 'Approve SG Security Overhaul', 'Confirm new camera placements by Ent.', 'user', 'u1', 'High', 'Pending Approval', fmt(today), 'Image', null, 0, '[]', '[]', 'u7');
insertTask.run(`t${counter++}`, 'w_sg', 'p2', 'Unload Iscon Fixtures', 'Receive truck with Iscon metal racks.', 'user', 'u7', 'High', 'Completed', fmt(twoDaysAgo), 'None', null, 7200, '[]', '[]', 'u2');

// Warehouse Tasks
insertTask.run(`t${counter++}`, 'w_wh', 'p3', 'Dispatch Truck MH-15-7777', 'Send grocery truck to CG Road.', 'user', 'u8', 'High', 'Todo', fmt(today), 'None', 'Daily', 0, '[]', '[]', 'u4');
insertTask.run(`t${counter++}`, 'w_wh', 'p3', 'Forklift Maintenance Checks', 'Service the main forklift hydraulic lines.', 'user', 'u8', 'Medium', 'In Progress', fmt(tomorrow), 'Document', 'Monthly', 3400, '[]', '[]', 'u4');
insertTask.run(`t${counter++}`, 'w_wh', 'p3', 'Verify Reliance Sub-Contractor Invoices', 'Pay the independent trucking companies.', 'user', 'u4', 'High', 'Pending Approval', fmt(yesterday), 'Document', null, 0, '[]', '[]', 'u1');
insertTask.run(`t${counter++}`, 'w_wh', 'p3', 'Check Temperature Logs (Cold Storage)', 'Log refrigeration temps.', 'user', 'u8', 'Critical', 'Completed', fmt(yesterday), 'None', 'Daily', 300, '[]', '[]', 'u4');
insertTask.run(`t${counter++}`, 'w_wh', 'p3', 'Bulk Apparel Receiving', 'Sort incoming fashion lines for all networks.', 'user', 'u8', 'Medium', 'Completed', fmt(lastWeek), 'None', null, 14400, '[]', '[]', 'u4');

// Iscon Tasks (Deactivated/Closed Store)
insertTask.run(`t${counter++}`, 'w_is', 'p5', 'Hand over retail keys to landlord', 'Final lease end walk-through.', 'user', 'u1', 'Critical', 'Completed', fmt(lastWeek), 'Document', null, 900, '[]', '[]', 'u1');


/******************************************
 * DRAFTS (INCOMING FROM APPS, ALERTS)
 ******************************************/
try {
  const insertDraft = db.prepare('INSERT INTO draft_tasks (id, phone_number, workspace_id, created_by, title, description, assigned_to_id, due_date, due_time, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  // MS Dhoni Drafts (HO / Cross)
  insertDraft.run('dr_ho1', '919999900000', 'w_ho', 'u1', 'Approve Corporate Diwali Budget', 'Finance team sent the festive spending request on WhatsApp', null, fmt(today), null, 'Critical', 'pending_confirmation');
  insertDraft.run('dr_ho2', null, 'w_ho', 'u1', 'Sign new HR Policy PDF', 'Need to review and approve the updated remote work timings.', null, fmt(tomorrow), null, 'Medium', 'saved');
  insertDraft.run('dr_ho3', '919898989898', 'w_ho', 'u1', 'Competitor PR Alert', 'Tata launched a new sale. Should we counter?', null, fmt(today), '18:00', 'High', 'pending_confirmation');
  insertDraft.run('dr_ho4', null, 'w_ho', 'u1', 'Historical Record: 2025 Store Review', 'Notes from the offsite meeting in Goa.', null, fmt(lastWeek), null, 'Low', 'saved'); // Past history
  insertDraft.run('dr_ho5', null, 'w_ho', 'u1', 'Q3 Performance Slides', 'Drafted slides for investor call, review numbers on slide 4.', null, fmt(yesterday), null, 'High', 'saved');
  
  // CG Road Drafts
  insertDraft.run('dr_cg1', '919999988888', 'w_cg', 'u3', 'Clean glass splinters near entrance', 'Customer dropped a perfume bottle', 'u5', fmt(today), '10:00', 'Critical', 'pending_confirmation');
  insertDraft.run('dr_cg2', null, 'w_cg', 'u3', 'Daily Standup Notes', 'Discuss hygiene and uniform checks.', null, fmt(tomorrow), null, 'Medium', 'saved');
  
  // Warehouse Drafts
  insertDraft.run('dr_wh1', '918888877777', 'w_wh', 'u4', 'Highway 8 Toll Blockade', 'Truck 9 is stuck due to local protests', null, fmt(today), null, 'High', 'pending_confirmation');
  insertDraft.run('dr_wh2', null, 'w_wh', 'u4', 'Damage report 04-2026', 'Pallet 44 was dropped, mapping ruined goods.', null, fmt(yesterday), null, 'Medium', 'saved');

} catch(e) {
  console.log('Skipping drafts table if missing fields', e);
}

/******************************************
 * TEAM CHATS (For ChatView activity)
 ******************************************/
const g1 = 'g_hq';
db.prepare('INSERT INTO groups (id, workspace_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(g1, 'w_ho', 'HQ Management', 'Core operations sync', 'u1');
db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g1, 'u1', 'admin');
db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g1, 'u2', 'member');
db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g1, 'u3', 'member');
db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g1, 'u4', 'member');

const insertMsg = db.prepare('INSERT INTO messages (id, workspace_id, sender_id, receiver_id, group_id, message) VALUES (?, ?, ?, ?, ?, ?)');
insertMsg.run('m1', 'w_ho', 'u1', null, g1, 'Virat, what is the status of the Iscon decommissioning?');
insertMsg.run('m2', 'w_ho', 'u2', null, g1, 'MS, Pant picked up the last of the shelves this morning. The site is clear.');
insertMsg.run('m3', 'w_ho', 'u3', null, g1, 'CG Road is ready for the weekend rush, but we need those extra cash registers approved in tasks.');
insertMsg.run('m4', 'w_ho', 'u1', null, g1, 'Thanks Rohit, I see it sitting in my Pending Approvals. Will authorize it shortly.');

console.log('Force seed completed successfully.');
process.exit(0);
