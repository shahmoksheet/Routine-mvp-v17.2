const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const sendNotifCode = `  const sendNotification = (userId, title, message, type) => {
    try {
      const user = db.prepare('SELECT is_deactivated, workspace_id, is_deleted FROM users WHERE id = ?').get(userId);
      if (!user || user.is_deactivated === 1 || user.is_deleted === 1) return;
      if (user.workspace_id) {
        const workspace = db.prepare('SELECT is_deactivated FROM workspaces WHERE id = ?').get(user.workspace_id);
        if (workspace && workspace.is_deactivated === 1) return;
      }
      const notifId = generateId('NOT');
      db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)').run(notifId, userId, title, message, type);
      io.to('user_' + userId).emit('notification', { id: notifId, title, message, type });
    } catch (e) {
      console.error('Error sending notification:', e);
    }
  };`;

if (!code.includes('const sendNotification = (userId')) {
  code = code.replace("io.on('connection', (socket) => {", sendNotifCode + "\n\n  io.on('connection', (socket) => {");
}

code = code.replace(
  /const notifId = generateId\('NOT'\);\s*db\.prepare\('INSERT INTO notifications[^;]+;\s*io\.to\([^;]+;\n/g, 
  ''
);

code = code.replace(
    /io\.to\(`user_\$\{member\.id\}`\)\.emit\('notification'.*?\);/g,
    "sendNotification(member.id, 'You were mentioned', `${sender?.name || 'Someone'} mentioned you in ${group?.name || 'a group'}`, 'mention');"
);

code = code.replace(
    /io\.to\(`user_\$\{memberId\}`\)\.emit\('notification'.*?\);/g,
    "sendNotification(memberId, 'Added to Group', `${sender?.name || 'Someone'} added you to the group: ${name}`, 'info');"
);

code = code.replace(
    /io\.to\(`user_\$\{assignedToId\}`\)\.emit\('notification'.*?\);/g,
    "sendNotification(assignedToId, 'New Task Assigned', `${sender?.name || 'Someone'} assigned you a new task: ${title}`, 'info');"
);

code = code.replace(
    /io\.to\(`user_\$\{u\.id\}`\)\.emit\('notification', \{ id: notifId, title: 'New Department Task'.*?\);/g,
    "sendNotification(u.id, 'New Department Task', `${sender?.name || 'Someone'} assigned a task to ${dept?.name || 'your department'}: ${title}`, 'info');"
);

code = code.replace(
    /io\.to\(`user_\$\{u\.id\}`\)\.emit\('notification', \{ id: notifId, title: 'New Role Task'.*?\);/g,
    "sendNotification(u.id, 'New Role Task', `${sender?.name || 'Someone'} assigned a task to ${roleObj?.name || 'your role'}: ${title}`, 'info');"
);

code = code.replace(
    /io\.to\(`user_\$\{task\.created_by\}`\)\.emit\('notification', \{ id: notifId, title: 'Task Updated'.*?\);/g,
    "sendNotification(task.created_by, 'Task Updated', `${sender?.name || 'Someone'} updated task status to ${updates.status}: ${task.title}`, 'info');"
);

// Timeline tracking hook in PATCH
const timelineHooks = `
      // Track timeline changes
      if (updates.dueDate !== undefined && updates.dueDate !== task.due_date) {
         const sender = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
         const ctext = \`Due date changed from \${task.due_date || 'None'} to \${updates.dueDate || 'None'}\`;
         const comments = JSON.parse(task.comments || '[]');
         comments.push({
            id: generateId('COM'),
            userId: 'system',
            text: ctext,
            createdAt: new Date().toISOString()
         });
         dbUpdates.comments = JSON.stringify(comments);
      }
`;

if (!code.includes('Track timeline changes')) {
   code = code.replace(
     /const dbUpdates: any = \{\};/,
     "const dbUpdates: any = {};\n" + timelineHooks
   );
}


fs.writeFileSync('server.ts', code);
console.log('Script completed.');
