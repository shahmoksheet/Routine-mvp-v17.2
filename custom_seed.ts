import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('app.db');
db.pragma('journal_mode = WAL');

console.log('Starting custom seed...');

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
insertWorkspace.run('w_wh', 'Warehouse', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_cg', 'CG Road', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_sg', 'SG Highway', 'u1', 'Enterprise', 0);
insertWorkspace.run('w_oc', 'Old City', 'u1', 'Enterprise', 1);

/******************************************
 * DEPARTMENTS
 ******************************************/
const insertDept = db.prepare('INSERT INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)');
insertDept.run('d_wh', 'w_wh', 'Supply Chain', 'u4');
insertDept.run('d_cg', 'w_cg', 'Store Operations', 'u2');
insertDept.run('d_sg', 'w_sg', 'Retail Experience', 'u3');
insertDept.run('d_oc', 'w_oc', 'Legacy Archives', 'u1');

/******************************************
 * ROLES
 ******************************************/
const adminPerms = '["manage_members","manage_roles","manage_departments","manage_projects","view_projects","manage_tasks","create_tasks","approve_tasks","manage_chat","use_ai","view_reports","view_audit_logs","switch_workspace"]';
const mgrPerms = '["view_tasks", "create_tasks", "update_tasks", "approve_tasks"]';
const qualityPerms = '["view_tasks", "update_tasks", "approve_tasks", "view_reports"]';
const staffPerms = '["view_tasks", "update_tasks"]';

const insertRole = db.prepare('INSERT INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)');
insertRole.run('r_owner', 'w_wh', 'd_wh', 'Director', adminPerms, '#4f46e5');
insertRole.run('r_admin', 'w_cg', 'd_cg', 'Admin Ops', adminPerms, '#8b5cf6');
insertRole.run('r_mgr', 'w_cg', 'd_cg', 'Store Manager', mgrPerms, '#ec4899');
insertRole.run('r_audit', 'w_wh', 'd_wh', 'Quality Inspector', qualityPerms, '#f59e0b');
insertRole.run('r_staff', 'w_cg', 'd_cg', 'Executive Staff', staffPerms, '#10b981');
insertRole.run('r_logistics', 'w_wh', 'd_wh', 'Logistics/Driver', staffPerms, '#3b82f6');

/******************************************
 * USERS
 ******************************************/
const insertUser = db.prepare('INSERT INTO users (id, workspace_id, department_id, role_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
// Owner
insertUser.run('u1', 'w_wh', 'd_wh', 'r_owner', 'Moksheet Shah', 'moksheet77@gmail.com', '7777777777', hashedPassword, 'Owner');

// Admin
insertUser.run('u2', 'w_cg', 'd_cg', 'r_admin', 'Virat Kohli', 'virat@demo.com', '8888888888', hashedPassword, 'Admin');

// Managers
insertUser.run('u3', 'w_sg', 'd_sg', 'r_mgr', 'Rohit Sharma', 'rohit@demo.com', '9999999991', hashedPassword, 'Manager');
insertUser.run('u4', 'w_wh', 'd_wh', 'r_mgr', 'Jasprit Bumrah', 'jasprit@demo.com', '9999999992', hashedPassword, 'Manager');

// Audit/Quality
insertUser.run('u5', 'w_wh', 'd_wh', 'r_audit', 'Ravindra Jadeja', 'jadeja@demo.com', '9999999993', hashedPassword, 'Manager');

// Staff
insertUser.run('u6', 'w_cg', 'd_cg', 'r_staff', 'Rishabh Pant', 'pant@demo.com', '9999999994', hashedPassword, 'Employee');
insertUser.run('u7', 'w_sg', 'd_sg', 'r_staff', 'Surya Kumar Yadav', 'surya@demo.com', '9999999995', hashedPassword, 'Employee');
insertUser.run('u8', 'w_wh', 'd_wh', 'r_logistics', 'KL Rahul', 'rahul@demo.com', '9999999996', hashedPassword, 'Employee');
insertUser.run('u9', 'w_oc', 'd_oc', 'r_staff', 'Mohammed Shami', 'shami@demo.com', '9999999997', hashedPassword, 'Employee');


db.prepare("UPDATE users SET department_ids = '[\"d_wh\",\"d_cg\",\"d_sg\",\"d_oc\"]' WHERE id = 'u1'").run();
db.prepare("UPDATE users SET department_ids = '[\"d_wh\",\"d_cg\",\"d_sg\",\"d_oc\"]' WHERE id = 'u2'").run();

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
insertProject.run('p_wh', 'w_wh', 'd_wh', 'Inventory Restock Pipeline', 'Inbound and outbound supply processes.', defaultCols);
insertProject.run('p_cg', 'w_cg', 'd_cg', 'Festive Season Setup', 'End cap displays and promotional materials.', defaultCols);
insertProject.run('p_sg', 'w_sg', 'd_sg', 'Store Makeover', 'Renovation and electrical updates.', defaultCols);
insertProject.run('p_oc', 'w_oc', 'd_oc', 'Closeout Audit', 'Decommissioning and remaining stock tally.', defaultCols);

/******************************************
 * TASKS
 ******************************************/
const insertTask = db.prepare('INSERT INTO tasks (id, workspace_id, project_id, title, description, assigned_to_type, assigned_to_id, priority, status, due_date, proof_type, recurring_rule, time_spent, comments, created_by, requires_approval, approver_id, geofence_lat, geofence_lng, geofence_radius, geofence_enforcement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

let tCounter = 1;

// Geo-fenced task for delivery driver (KL Rahul)
insertTask.run(`t${tCounter++}`, 'w_wh', 'p_wh', 'Deliver 500 units to SG Highway', 'Deliver and upload store manager signature.', 'user', 'u8', 'Critical', 'In Progress', fmt(today), 'Image', null, 3600, '[]', 'u4', 1, 'u4', 23.0225, 72.5714, 200, 'complete');

// Geo-fenced task for driver (KL Rahul) again
insertTask.run(`t${tCounter++}`, 'w_wh', 'p_wh', 'Deliver restock to CG Road', 'Unload 50 cartons.', 'user', 'u8', 'High', 'Todo', fmt(tomorrow), 'Location', null, 0, '[]', 'u4', 0, null, 23.0335, 72.5614, 100, 'start');


// Recurring task with manager approval (Rishabh Pant)
insertTask.run(`t${tCounter++}`, 'w_cg', 'p_cg', 'Daily Register Audit - Till #4', 'Count the cash and print summary report.', 'user', 'u6', 'High', 'Pending Approval', fmt(today), 'Document', 'Daily', 900, '[]', 'u2', 1, 'u2', null, null, null, null);

// Quality Audit validation task (Jadeja)
insertTask.run(`t${tCounter++}`, 'w_wh', 'p_wh', 'Inspect Shipment Alpha', 'Ensure no physical damage on incoming pallet.', 'user', 'u5', 'High', 'Todo', fmt(tomorrow), 'Image', null, 0, '[]', 'u1', 0, null, null, null, null, null);

// Recurring Maintenance (Surya)
insertTask.run(`t${tCounter++}`, 'w_sg', 'p_sg', 'Update Shelf Layout - Aisle B', 'Reflect new planogram.', 'user', 'u7', 'Medium', 'Completed', fmt(yesterday), 'None', 'Weekly', 5400, '[]', 'u3', 0, null, null, null, null, null);

// Admin / Owner Overview Tasks
insertTask.run(`t${tCounter++}`, 'w_cg', 'p_cg', 'Approve Q4 Marketing Budget', 'Analyze and sign off on print ad spends.', 'user', 'u1', 'Critical', 'Todo', fmt(nextWeek), 'None', null, 0, '[]', 'u2', 0, null, null, null, null, null);
insertTask.run(`t${tCounter++}`, 'w_sg', 'p_sg', 'Review Makeover Expenses', 'Verify interior decorator invoices.', 'user', 'u2', 'High', 'In Progress', fmt(tomorrow), 'Document', null, 1200, '[]', 'u1', 1, 'u1', null, null, null, null);
insertTask.run(`t${tCounter++}`, 'w_wh', 'p_wh', 'Review Compliance Reports', 'Ensure COVID guidelines are followed.', 'user', 'u1', 'Medium', 'Pending Approval', fmt(today), 'Document', 'Monthly', 3600, '[]', 'u2', 0, null, null, null, null, null);

/******************************************
 * ACTIVITY LOGS
 ******************************************/
const insertLog = db.prepare('INSERT INTO activity_logs (id, workspace_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)');
insertLog.run('l1', 'w_wh', 'u1', 'created_task', 'Created Inspect Shipment Alpha');
insertLog.run('l2', 'w_cg', 'u2', 'created_task', 'Created Approve Q4 Marketing Budget');
insertLog.run('l3', 'w_sg', 'u7', 'completed_task', 'Completed Update Shelf Layout - Aisle B');


/******************************************
 * DRAFTS
 ******************************************/
try {
  const insertDraft = db.prepare('INSERT INTO draft_tasks (id, workspace_id, created_by, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertDraft.run('dr1', 'w_wh', 'u4', 'Report Damaged Forklift', 'Hydraulic leak noticed this morning.', 'High', 'pending_confirmation');
  insertDraft.run('dr2', 'w_cg', 'u2', 'Festive Banner Vendor Delay', 'Need to source a backup printing vendor by EOD.', 'Critical', 'pending_confirmation');
} catch(e) {}

/******************************************
 * TEAM CHATS
 ******************************************/
const g1 = 'g1';
db.prepare('INSERT INTO groups (id, workspace_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(g1, 'w_wh', 'Supply Coordinators', 'Warehouse and logistics sync', 'u4');
['u1', 'u4', 'u5', 'u8'].forEach(uid => db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g1, uid, uid === 'u4' ? 'admin' : 'member'));

const insertMsg = db.prepare('INSERT INTO messages (id, workspace_id, sender_id, receiver_id, group_id, message) VALUES (?, ?, ?, ?, ?, ?)');
insertMsg.run('m1', 'w_wh', 'u4', null, g1, 'Rahul, when is the shipment heading to SG Highway?');
insertMsg.run('m2', 'w_wh', 'u8', null, g1, 'Loading truck now, will depart in 30 mins.');
insertMsg.run('m3', 'w_wh', 'u5', null, g1, 'I have completed the quality check on those palettes. All green.');
insertMsg.run('m4', 'w_wh', 'u1', null, g1, 'Great work team. Please ensure proof is uploaded matching the geo-fence.');

const g2 = 'g2';
db.prepare('INSERT INTO groups (id, workspace_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(g2, 'w_cg', 'Store Front Leads', 'CG Road Operations', 'u2');
['u1', 'u2', 'u3', 'u6'].forEach(uid => db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g2, uid, uid === 'u2' ? 'admin' : 'member'));

insertMsg.run('m5', 'w_cg', 'u2', null, g2, 'Pant, ensure the register audits are complete before closing.');
insertMsg.run('m6', 'w_cg', 'u6', null, g2, 'On it admin, wrapping up Till #4 now.');

const g3 = 'g3';
db.prepare('INSERT INTO groups (id, workspace_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(g3, 'w_sg', 'SG Refurb Team', 'Store Makeover chat', 'u3');
['u1', 'u2', 'u3', 'u7'].forEach(uid => db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(g3, uid, uid === 'u3' ? 'admin' : 'member'));


// Send a Direct Message from owner Moksheet (u1) to Rohit (u3)
insertMsg.run('m7', 'w_sg', 'u1', 'u3', null, 'Rohit, how are the new electrical updates going?');
insertMsg.run('m8', 'w_sg', 'u3', 'u1', null, 'Running slightly behind, but we will catch up by Friday.');

console.log('Demo seed completed successfully for Moksheet.');
process.exit(0);
