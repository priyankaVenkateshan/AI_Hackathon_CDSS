# AI Hackathon — Clinical Decision Support System (CDSS)

An AI-powered healthcare platform for Indian hospitals that combines role-based access control with specialized AI agents for patient management, surgical support, resource optimization, and clinical decision support.

## Where is everything?

- **This repo (plan, backend, infra)** — You are in the worktree: `...\AI_Hackathon_CDSS\agr`. It contains `clinical-decision-support-system/`, `infrastructure/`, `src/cdss/`, etc.
- **Doctor dashboard (frontend)** — It lives in **`D:\HACKATHON\CDSS-Frontend`** (separate folder).

**To have everything in one folder (e.g. `C:\AI_HACKATHON_CDSS` or `D:\AI_HACKATHON_CDSS`):**

1. Create a folder: `D:\AI_HACKATHON_CDSS` (or any path you want).
2. Copy the **entire contents** of this repo (agr) into it.
3. Copy the **entire contents** of `D:\HACKATHON\CDSS-Frontend` into the same folder (merge: you should get an `apps` folder with `doctor-dashboard`, a `backend` folder, and `infra` next to your existing `clinical-decision-support-system`, `infrastructure`, `src`).
4. Open `D:\AI_HACKATHON_CDSS` in Cursor/VS Code — you’ll see one project with plan, backend, infra, and frontend together.

## Overview

The Clinical Decision Support System (CDSS) provides:

- **Role-based access** — Doctor Module (full clinical access) and Patient Module (personal health only)
- **Five AI agents** — Patient, Surgery, Resource, Scheduling, and Patient Engagement agents communicating via Model Context Protocol (MCP)
- **India-first** — Multilingual support (Hindi, English, regional languages), cultural adaptation, and resource-aware design
- **Unified workflows** — Patient history, surgery readiness, medication adherence, real-time surgical support, and automated specialist replacement

## Repository Structure (after merging frontend)

```
AI_HACKATHON_CDSS/
├── apps/
│   └── doctor-dashboard/     # React doctor UI (from CDSS-Frontend)
├── backend/                  # Python Lambdas (from CDSS-Frontend)
├── infra/                    # CDK (from CDSS-Frontend)
├── clinical-decision-support-system/
│   ├── requirements.md
│   ├── design.md
│   └── implementation-plan.md
├── infrastructure/           # Terraform
├── src/
│   └── cdss/                # API handlers
├── .gitignore
└── README.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [Requirements](clinical-decision-support-system/requirements.md) | User stories, acceptance criteria, and system requirements |
| [Design](clinical-decision-support-system/design.md) | Architecture, multi-agent design, RBAC, and integration details |

## Key Capabilities

- **Patient Agent** — Patient profiles, surgery readiness, medical history, multilingual data
- **Surgery Agent** — Surgery classification, requirements, checklists, real-time procedural support
- **Resource Agent** — Staff, OT, and equipment availability; conflict detection
- **Scheduling Agent** — Surgical scheduling and resource allocation
- **Patient Engagement Agent** — Conversation summaries, medication reminders, adherence tracking

## License

See repository and project documentation for license and usage terms.
