# Cloud Incident Response & Alert Dispatch Console

A production-ready **Next.js (App Router, TypeScript, Tailwind CSS)** web application prototype that implements and coordinates three distinct software design patterns:
- **Strategy Pattern** (Behavioral)
- **Factory Pattern** (Creational)
- **Singleton Pattern** (Creational)

---

##  Web Technologies Used

1. **Next.js 14 (App Router & Server Routes)**: Modern full-stack React framework providing server-side API routing (`/api/incident`) and client-side rendering with Zero-Configuration TypeScript bundling.
2. **TypeScript 5**: Strong compile-time static typing enforcing strict interfaces for pattern products (`AlertDispatcher`), strategies (`EscalationStrategy`), context contracts, and singleton states.
3. **Tailwind CSS 3**: Utility-first styling framework enabling a sleek dark-mode command console (`bg-slate-950`, `bg-slate-900`) with responsive layouts, status badges, and micro-interactions.

---

## Architecture & Pattern Coordination Pipeline

When an engineer triggers an incident via the web dashboard, the request targets the `POST /api/incident` endpoint, orchestrating all three patterns in sequence:

```text
[ Web Dashboard UI (src/app/page.tsx) ]
                     │
                     ▼ (POST { channel, severity, message })
  [ API Controller (src/app/api/incident/route.ts) ]
                     │
     ┌───────────────┴─────────────────────────────────┐
     │                                                 │
     ▼                                                 ▼
1. STRATEGY PATTERN (Behavioral)              2. FACTORY PATTERN (Creational)
   • EscalationStrategy interface                • AlertDispatcher interface
   • CriticalEscalationStrategy (15m SLA)        • SlackDispatcher (Internal class)
   • WarningEscalationStrategy (120m SLA)        • PagerDutyDispatcher (Internal class)
   • InfoEscalationStrategy (1440m SLA)          • EmailDispatcher (Internal class)
   • EscalationContext.execute()                 • DispatcherFactory.createDispatcher()
     │                                                 │
     └────────────────────────┬────────────────────────┘
                              │
                              ▼
                 3. SINGLETON PATTERN (Creational)
                    • AuditLogger class
                    • Private constructor prevents external new
                    • AuditLogger.getInstance() controls global access
                    • In-memory audit logs & persistent sessionInstanceId
                              │
                              ▼
                 [ JSON Response with Dispatch Receipt,
                   Execution Trace, and Audit Logs ]
```

---

##  Exact File and Line References for Implemented Patterns

### 1. Strategy Pattern (Behavioral)
**File**: [`src/lib/patterns/strategy/EscalationStrategy.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/lib/patterns/strategy/EscalationStrategy.ts)
- **Common Strategy Interface (`EscalationStrategy`)**: Line 16 – Line 19
  - Method `processAlert(payload: { channel: string; rawMessage: string }): EscalationResult` (Line 18)
- **Concrete Strategy 1 (`CriticalEscalationStrategy`)**: Line 25 – Line 38
  - Returns priority `'P1-CRITICAL'`, SLA `15` minutes, and urgent siren headers (Lines 28–36)
- **Concrete Strategy 2 (`WarningEscalationStrategy`)**: Line 44 – Line 57
  - Returns priority `'MEDIUM'`, SLA `120` minutes, and warning advisory tags (Lines 47–55)
- **Concrete Strategy 3 (`InfoEscalationStrategy`)**: Line 63 – Line 76
  - Returns priority `'LOW'`, SLA `1440` minutes (24 hours), and notice tags (Lines 66–74)
- **Strategy Context (`EscalationContext`)**: Line 83 – Line 107
  - Strategy storage & constructor injection: Line 84 – Line 88
  - Runtime dynamic strategy swapping (`setStrategy`): Line 93 – Line 95
  - Execution delegation (`execute`): Line 104 – Line 106
- **Invocation in API Controller**: [`src/app/api/incident/route.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/app/api/incident/route.ts)
  - Strategy selection based on severity: Line 45 – Line 56
  - Context instantiation and execution: Line 59 – Line 63

---

### 2. Factory Pattern (Creational)
**File**: [`src/lib/patterns/factory/DispatcherFactory.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/lib/patterns/factory/DispatcherFactory.ts)
- **Product Interface (`AlertDispatcher`)**: Line 24 – Line 27
  - Readonly property `channelName: string` (Line 25)
  - Contract method `dispatch(alert: EscalationResult): DispatchReceipt` (Line 26)
- **Concrete Product 1 (`SlackDispatcher`)**: Line 33 – Line 53
  - Unexported class implementing `AlertDispatcher`, mocks HTTPS webhook delivery (Lines 37–51)
- **Concrete Product 2 (`PagerDutyDispatcher`)**: Line 59 – Line 79
  - Unexported class implementing `AlertDispatcher`, mocks urgent on-call push/voice event (Lines 63–77)
- **Concrete Product 3 (`EmailDispatcher`)**: Line 85 – Line 105
  - Unexported class implementing `AlertDispatcher`, mocks internal TLS SMTP relay dispatch (Lines 89–103)
- **Factory Class (`DispatcherFactory`)**: Line 112 – Line 125
  - Static creation method `createDispatcher(channelType)`: Line 113 – Line 124
  - Decides and instantiates concrete class without leaking concrete classes: Lines 114–123
- **Invocation in API Controller**: [`src/app/api/incident/route.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/app/api/incident/route.ts)
  - Factory call without exposing concrete classes: Line 69
  - Product execution (`dispatcher.dispatch`): Line 70

---

### 3. Singleton Pattern (Creational)
**File**: [`src/lib/patterns/singleton/AuditLogger.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/lib/patterns/singleton/AuditLogger.ts)
- **Private static field (`instance`)**: Line 19 (`private static instance: AuditLogger | null = null;`)
- **Public readonly session identifier (`sessionInstanceId`)**: Line 20
- **Private constructor**: Line 26 – Line 31
  - Prohibits external `new AuditLogger()` instantiation (Line 26)
  - Generates immutable `sessionInstanceId` once upon creation (Lines 27–29)
- **Global access point (`getInstance()`)**: Line 37 – Line 51
  - Guarantees exactly one instance exists throughout runtime and survives Next.js HMR (Lines 38–50)
- **State mutation & read methods**:
  - Append to in-memory log (`log`): Line 56 – Line 68
  - Read immutable snapshot (`getLogs`): Line 73 – Line 75
  - Clear history (`clear`): Line 80 – Line 82
- **Invocation in API Controller**: [`src/app/api/incident/route.ts`](file:///c:/Users/aaron/Desktop/Design%20Pattern/incident-dispatcher/src/app/api/incident/route.ts)
  - Log append: Line 76 – Line 81
  - Read logs in GET handler: Line 116 – Line 121
  - Clear logs in DELETE handler: Line 125 – Line 132

---

## How to Run the Project

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (`node -v`)
- **npm** v9.0.0 or higher (`npm -v`)

### 2. Installation
Open a terminal in the project directory:
```bash
cd "c:\Users\aaron\Desktop\Design Pattern\incident-dispatcher"
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot at **[http://localhost:3000](http://localhost:3000)**.

### 4. Production Build Verification
To compile and test the optimized production bundle:
```bash
npm run build
npm run start
```

### 5. Automated Pipeline Verification Script
Run the automated end-to-end pipeline test script:
```bash
node test-pipeline.mjs
```

---

## Verifying the Patterns Live in the UI

1. **Verify Strategy Pattern**:
   - Change the **Severity Level** selector between `Critical`, `Warning`, and `Info`.
   - Observe the dynamically recalculated SLA (`15m` ➔ `120m` ➔ `1440m`).
   - Click **Execute Incident Dispatch**; the receipt card verifies that `CriticalEscalationStrategy`, `WarningEscalationStrategy`, or `InfoEscalationStrategy` executed.
2. **Verify Factory Pattern**:
   - Switch the **Target Channel** between `PagerDuty`, `Slack`, and `Email`.
   - Inspect the receipt card: the dispatcher class (`PagerDutyDispatcher`, `SlackDispatcher`, or `EmailDispatcher`) is created by `DispatcherFactory` without the front-end or controller ever importing those concrete classes directly.
3. **Verify Singleton Pattern**:
   - Note the **`sessionInstanceId`** badge in the header and sidebar.
   - Dispatch multiple alerts. Every log entry contains the exact same `sessionInstanceId`.
   - Refresh the browser page or trigger alerts from different tabs: the `sessionInstanceId` remains constant, and previously recorded logs persist in memory.
