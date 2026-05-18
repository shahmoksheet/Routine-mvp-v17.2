import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database('app.db');
db.pragma('journal_mode = WAL');

// Initialize DB Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT,
    owner_id TEXT,
    subscription_plan TEXT DEFAULT 'Free',
    subscription_status TEXT DEFAULT 'active',
    org_type TEXT DEFAULT 'hierarchical',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    name TEXT,
    manager_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    department_id TEXT,
    name TEXT,
    description TEXT,
    permissions TEXT,
    color TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    department_id TEXT,
    role_id TEXT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    role TEXT, -- Owner, Admin, Manager, Employee
    language TEXT DEFAULT 'en',
    theme_color TEXT DEFAULT 'indigo',
    is_dark_mode INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    manager_id TEXT,
    kanban_columns TEXT DEFAULT '[{"id":"Todo","title":"To Do"},{"id":"In Progress","title":"In Progress"},{"id":"Pending Approval","title":"Review"},{"id":"Completed","title":"Done"}]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    department_id TEXT,
    department_ids TEXT DEFAULT '[]',
    name TEXT,
    description TEXT,
    kanban_columns TEXT DEFAULT '[{"id":"Todo","title":"To Do"},{"id":"In Progress","title":"In Progress"},{"id":"Pending Approval","title":"Review"},{"id":"Completed","title":"Done"}]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    project_id TEXT,
    title TEXT,
    description TEXT,
    type TEXT DEFAULT 'task',
    created_by TEXT,
    assigned_to_type TEXT, -- user, role, department
    assigned_to_id TEXT,
    priority TEXT,
    status TEXT, -- Pending, In Progress, Completed, Under Review, Approved, Rejected
    start_date TEXT,
    start_time TEXT,
    due_date TEXT,
    due_time TEXT,
    reminder_time TEXT,
    requires_approval INTEGER DEFAULT 0,
    approver_id TEXT,
    approval_status TEXT,
    proof_type TEXT DEFAULT 'None',
    photo_url TEXT,
    attachments TEXT DEFAULT '[]',
    checklist TEXT DEFAULT '[]',
    recurring_rule TEXT,
    time_spent INTEGER DEFAULT 0,
    comments TEXT DEFAULT '[]',
    subtasks TEXT DEFAULT '[]',
    geofence_lat REAL,
    geofence_lng REAL,
    geofence_radius REAL, -- in meters
    geofence_enforcement TEXT, -- 'start', 'complete', 'both',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    phone TEXT,
    code TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    template_name TEXT,
    description TEXT,
    project_id TEXT,
    checklist TEXT,
    verification_type TEXT,
    recurrence_rule TEXT,
    assigned_role TEXT,
    geofence_lat REAL,
    geofence_lng REAL,
    geofence_radius REAL,
    geofence_enforcement TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    user_id TEXT,
    type TEXT,
    file_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    approver_id TEXT,
    status TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    sender_id TEXT,
    receiver_id TEXT,
    group_id TEXT,
    message TEXT,
    attachment TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    name TEXT,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT,
    user_id TEXT,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    user_id TEXT,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    role_id TEXT,
    code TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS time_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    user_id TEXT,
    start_time DATETIME,
    end_time DATETIME,
    duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS draft_tasks (
    id TEXT PRIMARY KEY,
    phone_number TEXT,
    workspace_id TEXT,
    created_by TEXT,
    title TEXT,
    description TEXT,
    assigned_to_id TEXT,
    due_date TEXT,
    due_time TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending_confirmation',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add columns to existing tables if they don't exist
try { db.exec('ALTER TABLE roles ADD COLUMN workspace_id TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE roles ADD COLUMN description TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE roles ADD COLUMN color TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE roles ADD COLUMN is_system INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN geofence_lat REAL'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN geofence_lng REAL'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN geofence_radius REAL'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN geofence_enforcement TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN start_date TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN start_time TEXT'); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN dependencies TEXT DEFAULT '[]'"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN related_tasks TEXT DEFAULT '[]'"); } catch (e) {}
try { db.exec('ALTER TABLE templates ADD COLUMN geofence_lat REAL'); } catch (e) {}
try { db.exec('ALTER TABLE templates ADD COLUMN geofence_lng REAL'); } catch (e) {}
try { db.exec('ALTER TABLE templates ADD COLUMN geofence_radius REAL'); } catch (e) {}
try { db.exec('ALTER TABLE templates ADD COLUMN geofence_enforcement TEXT'); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN kanban_columns TEXT DEFAULT '[{\"id\":\"Todo\",\"title\":\"To Do\"},{\"id\":\"In Progress\",\"title\":\"In Progress\"},{\"id\":\"Pending Approval\",\"title\":\"Review\"},{\"id\":\"Completed\",\"title\":\"Done\"}]'"); } catch (e) {}
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT UNIQUE'); } catch (e) {}
try { db.exec('ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE users ADD COLUMN is_deactivated INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN department_ids TEXT DEFAULT '[]'"); } catch (e) {}
try { db.exec('ALTER TABLE workspaces ADD COLUMN is_deactivated INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE tasks ADD COLUMN is_deactivated INTEGER DEFAULT 0'); } catch (e) {}

// Seed initial data if empty
const workspaceCount = db.prepare('SELECT COUNT(*) as count FROM workspaces').get() as { count: number };
if (workspaceCount.count === 0) {
  db.prepare('INSERT OR IGNORE INTO workspaces (id, name, owner_id, subscription_plan) VALUES (?, ?, ?, ?)').run('w1', 'FreshMart Global', 'u7', 'Enterprise');
  db.prepare('INSERT OR IGNORE INTO workspaces (id, name, owner_id, subscription_plan, is_deactivated) VALUES (?, ?, ?, ?, ?)').run('w2', 'FreshMart Europe (Deactivated)', 'u7', 'Pro', 1);
  
  db.prepare('INSERT OR IGNORE INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)').run('d1', 'w1', 'Head Office', 'u3');
  db.prepare('INSERT OR IGNORE INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)').run('d2', 'w1', 'Sales & Retail', 'u5');
  db.prepare('INSERT OR IGNORE INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)').run('d3', 'w1', 'Logistics', 'u9');
  db.prepare('INSERT OR IGNORE INTO departments (id, workspace_id, name, manager_id) VALUES (?, ?, ?, ?)').run('d4', 'w1', 'Inventory', 'u11');
  
  db.prepare('INSERT OR IGNORE INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)').run('r1', 'w1', 'd1', 'Admin', '["manage_members","manage_roles","manage_departments","manage_projects","view_projects","manage_tasks","create_tasks","approve_tasks","manage_chat","use_ai","view_reports","view_audit_logs","switch_workspace"]', '#4f46e5');
  db.prepare('INSERT OR IGNORE INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)').run('r2', 'w1', 'd2', 'Store Manager', '["view_tasks", "create_tasks", "update_tasks", "approve_tasks"]', '#ec4899');
  db.prepare('INSERT OR IGNORE INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)').run('r3', 'w1', 'd3', 'Logistics Coordinator', '["view_tasks", "create_tasks", "update_tasks"]', '#f59e0b');
  db.prepare('INSERT OR IGNORE INTO roles (id, workspace_id, department_id, name, permissions, color) VALUES (?, ?, ?, ?, ?, ?)').run('r4', 'w1', 'd2', 'Sales Associate', '["view_tasks", "update_tasks"]', '#10b981');
}

// Always ensure demo users exist
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, workspace_id, department_id, role_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const hashedPassword = bcrypt.hashSync('password123', 10);

insertUser.run('u7', 'w1', null, null, 'Moksheet Shah', 'moksheet77@gmail.com', '7777777777', hashedPassword, 'Owner');
insertUser.run('u101', 'w1', 'd1', 'r2', 'Manager (Rohit)', 'rohit@demo.com', '1000000001', hashedPassword, 'Manager');
insertUser.run('u102', 'w1', 'd2', 'r2', 'Manager (Bumrah)', 'bumrah@demo.com', '1000000002', hashedPassword, 'Manager');
insertUser.run('u103', 'w1', 'd2', 'r4', 'Staff (Jadeja)', 'jadeja@demo.com', '1000000003', hashedPassword, 'Employee');
insertUser.run('u104', 'w1', 'd2', 'r4', 'Staff (Rahul)', 'rahul@demo.com', '1000000004', hashedPassword, 'Employee');
insertUser.run('u105', 'w1', 'd3', 'r4', 'Staff (Pant)', 'pant@demo.com', '1000000005', hashedPassword, 'Employee');
insertUser.run('u106', 'w1', 'd3', 'r4', 'Staff (Surya)', 'surya@demo.com', '1000000006', hashedPassword, 'Employee');
insertUser.run('u8', 'w1', 'd1', 'r1', 'Sarah Chen', 'sarah@globaltech.demo', '8888888888', hashedPassword, 'Admin');

const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
if (projectCount.count === 0) {
  const insertProject = db.prepare('INSERT OR IGNORE INTO projects (id, workspace_id, department_id, name, description, kanban_columns) VALUES (?, ?, ?, ?, ?, ?)');
  insertProject.run('p1', 'w1', 'd1', 'Store Expansion - Downtown', 'Opening a new outlet in the downtown area', JSON.stringify([
    { id: 'Todo', title: 'Planning' },
    { id: 'In Progress', title: 'Construction' },
    { id: 'Review', title: 'Inspection' },
    { id: 'Done', title: 'Launched' }
  ]));
  insertProject.run('p2', 'w1', 'd2', 'Holiday Sale 2026', 'Planning and execution of the annual holiday sale', JSON.stringify([
    { id: 'Todo', title: 'Inventory Check' },
    { id: 'In Progress', title: 'Marketing' },
    { id: 'Review', title: 'Staffing' },
    { id: 'Done', title: 'Active' }
  ]));
  insertProject.run('p3', 'w1', 'd3', 'Warehouse Optimization', 'Improving logistics and storage efficiency', JSON.stringify([
    { id: 'Todo', title: 'Audit' },
    { id: 'In Progress', title: 'Implementation' },
    { id: 'Done', title: 'Optimized' }
  ]));
}

const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
if (taskCount.count === 0) {
  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks 
    (id, workspace_id, project_id, title, description, assigned_to_type, assigned_to_id, priority, status, due_date, proof_type, recurring_rule, time_spent, comments, subtasks, created_by, requires_approval) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const yesterday = addDays(-1);
  const today = addDays(0);
  const tomorrow = addDays(1);
  const nextWeek = addDays(7);
  
  // Store Expansion Tasks
  insertTask.run('t1', 'w1', 'p1', 'Finalize Lease for Downtown Site', 'Review legal documents and sign the lease', 'user', 'u8', 'Critical', 'Completed', yesterday, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 0);
  insertTask.run('t2', 'w1', 'p1', 'Hire Store Staff', 'Interview and hire 20 new associates', 'user', 'u101', 'High', 'Pending Approval', today, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 1);
  
  // Holiday Sale Tasks
  insertTask.run('t3', 'w1', 'p2', 'Order Seasonal Inventory', 'Restock winter and holiday-themed products', 'user', 'u102', 'High', 'In Progress', tomorrow, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u101', 0);
  insertTask.run('t4', 'w1', 'p2', 'Design Sale Banners', 'Visual assets for store-front', 'user', 'u103', 'Medium', 'Todo', tomorrow, 'Image', null, 0, JSON.stringify([]), JSON.stringify([]), 'u102', 0);
  insertTask.run('t5', 'w1', 'p2', 'Cash Register Audit', 'Ensure all POS systems are balanced', 'user', 'u104', 'High', 'Pending Approval', yesterday, 'File', null, 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);
  
  // Logistics Tasks
  insertTask.run('t6', 'w1', 'p3', 'Route Optimization for Delivery', 'Analyze and improve delivery routes', 'user', 'u105', 'Medium', 'In Progress', nextWeek, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u101', 0);
  insertTask.run('t7', 'w1', 'p3', 'Inventory Check - Section B', 'Perform a full count of stock in Section B', 'user', 'u106', 'Low', 'Todo', nextWeek, 'Image', 'Monthly', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);

  // More tasks for everyone (Retail tasks)
  insertTask.run('t8', 'w1', 'p2', 'Morning Shelf Restocking', 'Restock the front aisles before store opens', 'user', 'u103', 'Medium', 'Pending Approval', today, 'Image', 'Daily', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);
  insertTask.run('t9', 'w1', 'p2', 'Customer Feedback Review', 'Check latest survey results', 'user', 'u101', 'Low', 'Todo', tomorrow, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 0);
  insertTask.run('t10', 'w1', 'p3', 'End of Day Reporting', 'Generate sales and inventory counts', 'user', 'u104', 'High', 'Pending Approval', today, 'File', 'Daily', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);
}

const groupCount = db.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number };
if (groupCount.count === 0) {
  const insertGroup = db.prepare('INSERT OR IGNORE INTO groups (id, workspace_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)');
  const insertMember = db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)');
  const insertMsg = db.prepare('INSERT OR IGNORE INTO messages (id, workspace_id, sender_id, receiver_id, group_id, message) VALUES (?, ?, ?, ?, ?, ?)');

  insertGroup.run('g1', 'w1', 'Retail Leaders', 'Store Managers coordination', 'u7');
  ['u7', 'u101', 'u102'].forEach(uid => insertMember.run('g1', uid, uid === 'u7' ? 'admin' : 'member'));
  insertMsg.run('m1', 'w1', 'u7', null, 'g1', 'Welcome Bumrah and Rohit to the management team!');
  insertMsg.run('m2', 'w1', 'u101', null, 'g1', 'Thanks Moksheet. The downtown store lease is signed.');
  insertMsg.run('m3', 'w1', 'u102', null, 'g1', 'Ready to scale the holiday sales strategy.');

  insertGroup.run('g2', 'w1', 'Store Staff', 'General staff tracking', 'u101');
  ['u101', 'u102', 'u103', 'u104', 'u105', 'u106', 'u7'].forEach(uid => insertMember.run('g2', uid, 'member'));
  insertMsg.run('m4', 'w1', 'u102', null, 'g2', 'Everyone, please ensure register audits are done before clocking out.');
  insertMsg.run('m5', 'w1', 'u103', null, 'g2', 'Got it!');
  insertMsg.run('m6', 'w1', 'u104', null, 'g2', 'Doing it now.');

  // DMs between owner (u7) and others
  insertMsg.run('m7', 'w1', 'u7', 'u105', null, 'Pant, how goes the route planning?');
  insertMsg.run('m8', 'w1', 'u105', 'u7', null, 'Making progress, should have it finalized by tomorrow.');
  insertMsg.run('m9', 'w1', 'u7', 'u106', null, 'Hey Surya, check the new inventory spreadsheet.');
  insertMsg.run('m10', 'w1', 'u106', 'u7', null, 'Will do!');
}

const draftCount = db.prepare('SELECT COUNT(*) as count FROM draft_tasks').get() as { count: number };
if (draftCount.count === 0) {
  const insertDraft = db.prepare('INSERT OR IGNORE INTO draft_tasks (id, phone_number, workspace_id, created_by, title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  insertDraft.run('drf1', '+919876543210', 'w1', 'u7', 'Plan Q3 Promotions Strategy', 'Discuss with Rohit to set up Q3 promotions.', 'High', addDays(7), 'pending_confirmation');
  insertDraft.run('drf2', '+918888888888', 'w1', 'u7', 'Vendor Selection for Fall Line', 'We need to finalize the apparel vendor by Friday.', 'Medium', addDays(7), 'pending_confirmation');
  insertDraft.run('drf3', '+917777777777', 'w1', 'u7', 'Renew Software Licenses', 'Check billing for our ERP and CRM tools.', 'Low', addDays(0), 'pending_confirmation');
}

const moksheetUser = db.prepare('SELECT * FROM users WHERE email = ?').get('moksheet77@gmail.com');
if (!moksheetUser) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  try {
    db.prepare('INSERT OR IGNORE INTO users (id, workspace_id, department_id, role_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('u7', 'w1', null, null, 'Moksheet Shah', 'moksheet77@gmail.com', '7777777777', hashedPassword, 'Owner');
  } catch (e) {
    console.error('Failed to seed moksheet user:', e);
  }
}

export default db;
