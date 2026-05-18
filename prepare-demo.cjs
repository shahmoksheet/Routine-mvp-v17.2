// node prepare-demo.cjs
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('app.db');

console.log('Resetting demo data tables...');

const deleteTables = [
  'users', 'projects', 'tasks', 'draft_tasks', 'groups', 'group_members', 'messages'
];
for (const table of deleteTables) {
  if (table === 'group_members') {
    db.prepare(`DELETE FROM ${table}`).run();
  } else {
    db.prepare(`DELETE FROM ${table} WHERE id != 'admin'`).run();
  }
}

console.log('Inserting demo users...');

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, workspace_id, department_id, role_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const hashedPassword = bcrypt.hashSync('password123', 10);

insertUser.run('u7', 'w1', null, null, 'Moksheet Shah', 'moksheet77@gmail.com', '7777777777', hashedPassword, 'Owner');
insertUser.run('u101', 'w1', 'd1', 'r2', 'Manager (Rohit)', 'rohit@demo.com', '1000000001', hashedPassword, 'Manager');
insertUser.run('u102', 'w1', 'd2', 'r2', 'Manager (Bumrah)', 'bumrah@demo.com', '1000000002', hashedPassword, 'Manager');
insertUser.run('u103', 'w1', 'd2', 'r4', 'Staff (Jadeja)', 'jadeja@demo.com', '1000000003', hashedPassword, 'Employee');
insertUser.run('u104', 'w1', 'd2', 'r4', 'Staff (Rahul)', 'rahul@demo.com', '1000000004', hashedPassword, 'Employee');
insertUser.run('u105', 'w1', 'd3', 'r4', 'Staff (Pant)', 'pant@demo.com', '1000000005', hashedPassword, 'Employee');
insertUser.run('u106', 'w1', 'd3', 'r4', 'Staff (Surya)', 'surya@demo.com', '1000000006', hashedPassword, 'Employee');

console.log('Inserting demo projects...');

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

console.log('Inserting demo tasks...');

// Provide multiple statuses, priorities, due dates, and users
const insertTask = db.prepare(`
  INSERT OR IGNORE INTO tasks 
  (id, workspace_id, project_id, title, description, assigned_to_type, assigned_to_id, priority, status, due_date, proof_type, recurring_rule, time_spent, comments, subtasks, created_by, requires_approval) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Date helper
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const yesterday = addDays(-1);
const today = addDays(0);
const tomorrow = addDays(1);
const nextWeek = addDays(7);

// Tasks for Project 1 (Store Expansion)
insertTask.run('t1', 'w1', 'p1', 'Finalize Lease for Downtown Site', 'Review legal documents and sign the lease', 'user', 'u101', 'Critical', 'Completed', yesterday, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 0);
insertTask.run('t2', 'w1', 'p1', 'Hire Store Staff', 'Interview and hire 20 new associates', 'user', 'u101', 'High', 'Pending Approval', today, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 1);

// Tasks for Project 2 (Holiday Sale)
insertTask.run('t3', 'w1', 'p2', 'Order Seasonal Inventory', 'Restock winter and holiday-themed products', 'user', 'u102', 'High', 'In Progress', tomorrow, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u101', 0);
insertTask.run('t4', 'w1', 'p2', 'Design Sale Banners', 'Visual assets for store-front', 'user', 'u103', 'Medium', 'Todo', tomorrow, 'Image', null, 0, JSON.stringify([]), JSON.stringify([]), 'u102', 0);
insertTask.run('t5', 'w1', 'p2', 'Cash Register Audit', 'Ensure all POS systems are balanced', 'user', 'u104', 'High', 'Pending Approval', yesterday, 'File', null, 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);

// Tasks for Project 3 (Warehouse)
insertTask.run('t6', 'w1', 'p3', 'Route Optimization for Delivery', 'Analyze and improve delivery routes', 'user', 'u105', 'Medium', 'In Progress', nextWeek, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u101', 0);
insertTask.run('t7', 'w1', 'p3', 'Inventory Check - Section B', 'Perform a full count of stock in Section B', 'user', 'u106', 'Low', 'Todo', nextWeek, 'Image', 'Monthly', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);

// More tasks for everyone (Retail tasks)
insertTask.run('t8', 'w1', 'p2', 'Morning Shelf Restocking', 'Restock the front aisles before store opens', 'user', 'u103', 'Medium', 'Pending Approval', today, 'Image', 'Daily', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);
insertTask.run('t9', 'w1', 'p2', 'Customer Feedback Review', 'Check latest survey results', 'user', 'u101', 'Low', 'Todo', tomorrow, 'None', null, 0, JSON.stringify([]), JSON.stringify([]), 'u7', 0);
insertTask.run('t10', 'w1', 'p3', 'End of Day Reporting', 'Generate sales and inventory counts', 'user', 'u104', 'High', 'Pending Approval', today, 'File', 'Daily', 0, JSON.stringify([]), JSON.stringify([]), 'u102', 1);

console.log('Inserting group chats...');
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

console.log('Inserting drafts for Owner...');
const insertDraft = db.prepare('INSERT OR IGNORE INTO draft_tasks (id, phone_number, workspace_id, created_by, title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertDraft.run('drf1', '+919876543210', 'w1', 'u7', 'Plan Q3 Promotions Strategy', 'Discuss with Rohit to set up Q3 promotions.', 'High', nextWeek, 'pending_confirmation');
insertDraft.run('drf2', '+918888888888', 'w1', 'u7', 'Vendor Selection for Fall Line', 'We need to finalize the apparel vendor by Friday.', 'Medium', nextWeek, 'pending_confirmation');
insertDraft.run('drf3', '+917777777777', 'w1', 'u7', 'Renew Software Licenses', 'Check billing for our ERP and CRM tools.', 'Low', today, 'pending_confirmation');

console.log('Done.');
