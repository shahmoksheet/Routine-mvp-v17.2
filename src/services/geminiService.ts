import { GoogleGenAI } from "@google/genai";

// Safe way to get API key in both Node and Browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  
  try {
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
      return (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  
  return '';
};

let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will fail.");
      return new GoogleGenAI({ apiKey: 'missing-api-key' });
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function suggestTasks(project: string) {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 professional, highly detailed task templates for a project named "${project}" in a task management app. 
      Return the response as a JSON array of objects with the following fields:
      - "title": A clear, actionable task title.
      - "description": A detailed description of what needs to be done.
      - "priority": "High", "Medium", or "Low".
      - "dueDate": "Today", "Tomorrow", or "Next Week".
      - "recurring": "None", "Daily", "Weekly", or "Monthly".
      - "subtasks": An array of strings representing sub-steps to complete the task.
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return [];
  }
}

export async function chatWithBot(message: string, onTaskCreate?: (task: any) => void) {
  try {
    let contents: any = message;

    const createTaskDeclaration = {
      name: "createTask",
      description: "Create a new task in the task management system. Use this when the user asks to create a task, schedule something, or add a reminder.",
      parameters: {
        type: "OBJECT" as any,
        properties: {
          title: { type: "STRING" as any, description: "The title of the task." },
          description: { type: "STRING" as any, description: "Detailed description of the task." },
          priority: { type: "STRING" as any, description: "Priority of the task: 'High', 'Medium', or 'Low'." },
          dueDate: { type: "STRING" as any, description: "Due date in YYYY-MM-DD format." },
          recurring: { type: "STRING" as any, description: "Recurring rule: 'None', 'Daily', 'Weekly', or 'Monthly'." }
        },
        required: ["title"]
      }
    };

    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: "You are Routine AI, a helpful assistant. You can answer questions, scrape data from the web using Google Search, and create tasks for the user.",
        tools: [{ googleSearch: {} }, { functionDeclarations: [createTaskDeclaration as any] }],
        toolConfig: { includeServerSideToolInvocations: true } as any
      }
    });

    let reply = response.text;

    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === 'createTask' && onTaskCreate) {
          const args = call.args as any;
          onTaskCreate(args);
          reply = `I have created the task: "${args.title}".`;
        }
      }
    }

    return reply;
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

export async function generateOnboardingTemplates(companyName: string, industry: string, subIndustry: string, teamSize: string, goals: string[]) {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are an expert organizational consultant. Based on the following business profile, suggest a high-quality, professional workspace configuration for a task management app named "Routine".
      
      Business Name: "${companyName}"
      Industry: "${industry}" (Sub-industry: "${subIndustry}")
      Team Size: "${teamSize}"
      Primary Goals: ${goals.join(', ')}
      
      Return a JSON object with EXACTLY these fields:
      - "departments": An array of objects with "name" and "description" (at least 3 departments relevant to this business).
      - "roles": An array of objects with "name", "description", and "level" (levels should be 'Manager' or 'Employee').
      - "taskTemplates": An array of at least 5 common recurring tasks for this industry. Each task object must have:
        - "title": Actionable task name.
        - "description": Process steps.
        - "priority": "High", "Medium", or "Low".
        - "recurring": "Daily", "Weekly", "Monthly", or "None".
        - "subtasks": Array of strings (steps).
      - "kanbanColumns": An array of 4-5 column names defined for their specific operational flow (e.g., ["To Do", "In Setup", "Execution", "Review", "Done"]).
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini onboarding suggestion error:", error);
    return null;
  }
}

export async function parseVoiceToTask(voiceInput: string) {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following voice command (which may be in Hindi, Hinglish, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, or English) into a task object. 
      Command: "${voiceInput}"
      
      Return a JSON object with the following fields:
      - "title": A concise, professional English translation of the task title.
      - "description": A slightly more detailed description in English (optional).
      - "priority": "High", "Medium", or "Low" (infer from urgency words like "urgent", "jaldi", etc., default to "Medium").
      - "recurring": "None", "Daily", "Weekly", or "Monthly" (infer from words like "raat ko", "roz", "everyday", "har din", etc.).
      - "dueDate": "Today", "Tomorrow", or a specific date if mentioned (optional).
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini voice parsing error:", error);
    return null;
  }
}
