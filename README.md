# AI Hackathon — Clinical Decision Support System (CDSS)

An AI-powered healthcare platform for Indian hospitals that combines role-based access control with specialized AI agents for patient management, surgical support, resource optimization, and clinical decision support.

## Overview

The Clinical Decision Support System (CDSS) provides:

- **Role-based access** — Doctor Module (full clinical access) and Patient Module (personal health only)
- **Five AI agents** — Patient, Surgery, Resource, Scheduling, and Patient Engagement agents communicating via Model Context Protocol (MCP)
- **India-first** — Multilingual support (Hindi, English, regional languages), cultural adaptation, and resource-aware design
- **Unified workflows** — Patient history, surgery readiness, medication adherence, real-time surgical support, and automated specialist replacement

## Repository Structure

```
AI_hackathon_CDSS/
├── clinical-decision-support-system/
│   ├── requirements.md   # Functional requirements and acceptance criteria
│   └── design.md        # Architecture, agents, and technical design
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
