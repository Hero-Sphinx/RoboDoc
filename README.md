# 🤖 ROBO-DOC

### **Next-Gen AI Clinical Triage & Real-Time Patient Orchestration Engine**

> **Engineered to eliminate Emergency Department bottlenecks.** RoboDoc is an event-driven, dual-channel triage engine that combines safety-critical hardware monitoring emulation with localized generative AI. By isolating heavy linguistic computing from high-availability alerting, RoboDoc processes incoming medical metrics in milliseconds, instantly routing emergency flags to physician devices while continuously orchestrating live clinic queues.

---

## ⚡ The Core Philosophy: Why RoboDoc Exists

Traditional Emergency Department tracking tools suffer from a fatal flaw: **synchronous blocking**. When a system waits for an AI model or complex data logging to complete, critical patient updates sit in a queue. If an incoming patient is experiencing acute tachycardia, a 3-second delay in system processing could change a clinical outcome.

RoboDoc changes this narrative by applying an **Asynchronous Non-Blocking Pipeline Architecture** to clinical intake:

```
               [ RAW CLINICAL INTAKE: SYMPTOMS & VITALS ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│     CRITICAL EVENT LOOP         │               │     HEAVY COMPUTE PIPELINE      │
│  (Synchronous & Non-Blocking)   │               │   (Asynchronous & Isolated)     │
├─────────────────────────────────┤               ├─────────────────────────────────┤
│  • Instant Threshold Evaluation  │               │  • Gemini 2.0 Multi-Turn LLM    │
│  • Low-Latency SQLite Record    │               │  • Bilingual Clinical NLP       │
│  • Twilio Doctor SMS Trigger    │               │  • Dynamic Context Compilation  │
│  • Socket.io Live-Emit Broadcast│               │                                 │
│    (Execution: < 45ms)          │               │    (Execution: ~1500ms)         │
└────────────────┬────────────────┘               └────────────────┬────────────────┘
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          ▼
                         [ UNIFIED PATIENT PORTAL STREAM ]

```

---

## 🏗 Architectural Blueprint & Data Flight-Path

RoboDoc operates a decoupled, dual-channel pipeline built to keep live clinic monitors operational, even if third-party cloud infrastructure faces external downtime.

### 1. Ingestion & Instant Validation Layer

* Clinical operators or automated check-in kiosks input raw physical metrics along with unformatted, multi-lingual symptom descriptions.
* The intake controller evaluates critical physical boundaries instantly:

$$\text{Alert Trigger} = (\text{Heart Rate} > 100\text{ BPM}) \lor (\text{Core Temp} > 39^\circ\text{C})$$

### 2. High-Priority Alerting & Persistence (Channel A - Core Execution)

* **Zero-Blocking Commit:** The system processes data using a type-safe Prisma schema, running atomic writes to an optimized SQLite engine.
* **Immediate Telemetry Routing:** If physical metrics exceed the emergency limits, the execution loop bypasses all AI features. It drops a direct webhook payload into the Twilio API network, sending a critical high-priority SMS straight to the on-duty doctor's device.
* **UI State Sync:** Simultaneously, `Socket.io` fires a live broadcast. The Doctor Dashboard immediately flashes an alert and triggers a high-priority sound chime before the downstream AI analysis even starts.

### 3. Isolated Linguistic Analysis (Channel B - AI Compute)

* **Thread Isolation:** The system pushes the symptom payload into a background asynchronous worker thread running the **Google Gemini 2.0 Flash** engine.
* **Smart Prompt Architecture:** The AI model is strictly isolated within a secure system prompt. It operates solely as a preliminary administrative assistant—filtering out non-medical noise, summarizing symptom histories, and preparing the file for the physician.
* **Bilingual Translation On-The-Fly:** An internal string-matching matrix tracks syntax patterns to instantly detect whether input text is in English or French, prompting the AI engine to respond in the patient's native tongue.

### 4. Dynamic PDF Compilation Layer

* When a patient is discharged or transferred, the client browser builds a localized clinical brief using an automated layout calculation matrix backed by `jsPDF`.
* To maintain strict medical compliance, the code uses manual coordinate shifts via a `currentY` tracker. This ensures **AI Preliminary Suggestions** remain entirely separate from **Official Physician Records**, preventing overlapping text boundaries on multi-page files.

---

## 🛠 Strategic Technology Blueprint

| Layer | Technology Stack | Implementation Protocol |
| --- | --- | --- |
| **Frontend Framework** | `React 19` (Vite SPA) | Handles ultra-fast interface rendering and updates component sub-trees efficiently without UI lag. |
| **Interface System** | `Tailwind CSS` + `Shadcn/UI` | Fully accessible design architecture utilizing modern structural layouts and clean theme systems. |
| **Real-Time Layer** | `Socket.io` & `WebSockets` | Manages persistent duplex pipelines between frontend monitors and backend processes. |
| **Server Engine** | `Node.js` + `Express.js` | Runs a high-concurrency, event-driven architecture to keep network traffic fluid and fast. |
| **Data Orchestration** | `Prisma ORM` | Guarantees type safety across structural layers with automated database migration systems. |
| **Database Core** | `SQLite` | Handles database writes with ACID-compliant, local storage operations. |
| **AI Intelligence** | `Gemini 2.0 Flash` | Processes structured medical text inputs through a low-latency, semantic language API. |
| **Emergency Outbound** | `Twilio Communication Gate` | Provides a direct cellular carrier gateway to send critical alerts outside the local network. |

---

## 🚀 Key Engineering Milestones & Fixes

### 🛡️ 1. Multi-Channel Fail-Safe Socket Routines

* **The Problem:** Early tests showed that if cloud networks experienced latency while processing the Gemini API, the local nurse terminal would freeze, pausing patient updates until the external server responded.
* **The Solution:** Separated the workflow logic. The server now returns an immediate **HTTP 202 Accepted** status and pushes a socket event to the UI *prior* to contacting the Gemini API. The local UI updates instantly; the AI results arrive as a clean, secondary background update once ready.

### 🌍 2. Automatic Localized Translation Logic

* **The Problem:** Processing multitalented patients in diverse metropolitan areas requires fluid language parsing without adding heavy processing packages.
* **The Solution:** Built an inline, non-blocking regex profiling system that scans intake records for local linguistic markers. The application automatically appends targeted system instructions to the generative AI payload, producing accurate, French or English clinical reports based on patient preferences.

### 📄 3. Automated PDF Coordinate Tracking Matrix

* **The Problem:** Medical text logs vary wildly in length. Using standard static canvas layouts meant that long paragraphs often overflowed, overlapping physical metrics with text.
* **The Solution:** Programmed a modular data-parsing matrix using `jsPDF`. The script computes exact line-height dynamics on the fly, tracking data lines through a changing variable (`currentY`). If a block of text threatens to cross a page boundary, the system inserts an explicit page break, carrying over structural column headers automatically.

---

## 📋 Environment Configuration

To run this platform in a live production environment, create a `.env` file in the root server directory containing these verified tokens:

```env
# Database Storage Engine Path
DATABASE_URL="file:./dev.db"

# Google AI Core Access Secret
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Twilio Infrastructure Gateway Configuration
TWILIO_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE="+1XXXXXXXXXX"

# Targeted On-Duty Clinician Endpoint
DOCTOR_PHONE="+1XXXXXXXXXX"

```

---

## 📦 Local Installation & Deployment Core

1. Clone the master repository and enter the project directory:
```bash
git clone https://github.com/yourusername/robodoc.git
cd robodoc

```


2. Spin up the backend environment and map data tables:

```bash
   cd server
   npm install
   npx prisma db push
   npm run dev

```

3. Launch the client interface and interactive dashboards:

```bash
   cd ../client
   npm install
   npm run dev

```

4. Access the localized ecosystem nodes via your browser:
* **Patient Intake Station:** `http://localhost:5173/`
* **Clinical Doctor Dashboard:** `http://localhost:5173/doctor`

