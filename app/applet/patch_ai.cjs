const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// 1. Add Gemini imports
if (!serverCode.includes('@google/genai')) {
  serverCode = serverCode.replace(
    "import type { AuthRequest } from './server/middleware/auth.ts';",
    "import type { AuthRequest } from './server/middleware/auth.ts';\nimport { GoogleGenAI, Type } from '@google/genai';"
  );
}

// 2. Add /api/drafts/parse
if (!serverCode.includes('/api/drafts/parse')) {
  const parseEndpoint = `
  app.post('/api/drafts/parse', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      const { id: userId, workspaceId } = req.user!;

      if (!text || !userId || !workspaceId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let ai;
      try {
        // Fallback to dummy if key is not configured, though Gemini strictly needs a real one for completion
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });
      } catch (e) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: \`Parse the following raw text or voice snippet into structured task data.\\n\\nRaw Input: "\${text}"\\n\\nDo your best to infer the priority (High, Medium, Low) based on urgency words. If a due date or time is explicitly stated or can be reasonably inferred (e.g., 'tomorrow', 'next week'), extract it.\\n\`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A concise, actionable title for the task (max 60 chars)" },
              description: { type: Type.STRING, description: "Detailed description of the task based on the input" },
              priority: { type: Type.STRING, description: "Priority level: High, Medium, or Low" },
              due_date: { type: Type.STRING, description: "Extracted due date in YYYY-MM-DD format if applicable, else null" },
              due_time: { type: Type.STRING, description: "Extracted due time in HH:mm format if applicable, else null" },
            },
            required: ["title", "description", "priority"]
          }
        }
      });
      
      const jsonResponse = JSON.parse(response.text || '{}');
      const draftId = generateId('DRF');

      db.prepare(\`
        INSERT INTO draft_tasks 
        (id, workspace_id, created_by, title, description, priority, due_date, due_time, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`).run(
        draftId, 
        workspaceId, 
        userId, 
        jsonResponse.title || 'Untitled AI Task', 
        jsonResponse.description || '', 
        jsonResponse.priority || 'Medium', 
        jsonResponse.due_date || null,
        jsonResponse.due_time || null,
        'pending_confirmation'
      );

      res.json({ id: draftId, ...jsonResponse });
    } catch (error: any) {
      console.error('Failed to parse draft from AI', error);
      res.status(500).json({ error: 'Failed to process AI draft' });
    }
  });
`;
  
  serverCode = serverCode.replace(
    "app.get('/api/drafts', authMiddleware",
    parseEndpoint + "\n  app.get('/api/drafts', authMiddleware"
  );
}

fs.writeFileSync('server.ts', serverCode);
console.log('AI parsing endpoint added correctly!');
