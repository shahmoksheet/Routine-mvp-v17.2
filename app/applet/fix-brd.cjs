const fs = require('fs');
let content = fs.readFileSync('final-brd.md', 'utf8');

// Flutter -> React target
content = content.replace(
  'The target platform for the mobile application is Flutter (iOS & Android).',
  'The current deployed application is a responsive React Web Application. Future target platforms include native mobile applications via React Native or Flutter.'
);
content = content.replace(
  '*   **Mobile Apps (confirmed):** Flutter (iOS & Android).',
  '*   **Frontend Client:** React (Web SPA). Native Mobile Apps (Flutter/React Native) are positioned for future roadmaps.'
);

// Offline sync
content = content.replace(
  'The architecture must support offline-first mobile sync, real-time updates',
  'The architecture provides real-time WebSocket updates, with offline-first synchronization positioned for future mobile roadmaps'
);

const roadmapInject = `### 26.2 Advanced Omnichannel AI Extractor
*   **WhatsApp & OpenAI Integration:** While the Drafts inbox architecture exists and supports staging manually saved tasks, automated parsing via WhatsApp webhooks and LLMs (OpenAI) represents a future integration phase.
*   **Media Parsing:** Converting voice notes shared from native iOS/Android share sheets into structured payloads.

### 26.3 Advanced Geofencing & Hardware Sensors
*   **Native GPS Validation:** While the platform maps Geofences (Latitude, Longitude, Radius) natively within the Task Schema, real-time native device GPS bridging to actively block "Start Timer" buttons on mobile devices will arrive with the native mobile app wrapper.

### 26.4 Vasy ERP Integration`;

content = content.replace('### 26.2 Vasy ERP Integration', roadmapInject);

content = content.replace(
  '*   **Ingestion Sources:** Users can forward messages from WhatsApp or share text from native Notes apps directly into Routine.',
  '*   **Ingestion Sources:** Users can manually save Drafts, with WhatsApp and native Notes integrations mapped out for the native mobile rollout.'
);

content = content.replace(
  '**Routine Answer:** Omnichannel Input — staff send a voice note or text to Routine via WhatsApp or Native Notes. AI parses the natural language, creates a structured draft task, and asks for a one-tap confirmation.',
  '**Routine Answer:** Omnichannel Input — establishing a framework where external inputs stage as structured draft tasks awaiting one-tap manager confirmation.'
);

fs.writeFileSync('final-brd.md', content);
console.log('Fixed BRD accuracy.');
