# Phase 5 — Project Monitoring Implementation Plan

Status: DRAFT — do not start coding until approved.

## Goal
Implement Project Monitoring to track site visits, progress updates, photo evidence, quality checks, delays and completion requests, surfaced via a Monitoring Dashboard for inspectors, contractors, and admins.

---

## 1) Task Breakdown (high-level)
- 1.1 Requirements & data model review
- 1.2 Backend models & indexes
- 1.3 APIs (CRUD + metrics endpoints)
- 1.4 Background jobs & alerts (scheduler)
- 1.5 Frontend pages + components
- 1.6 Mobile views (responsive / small screens)
- 1.7 Tests: unit + smoke + runtime validation
- 1.8 Security & access controls
- 1.9 Documentation + rollout plan

Estimated sprints: 3–4 (design → implementation → tests → staging)

---

## 2) Database Design
Collections (new)
- `ProjectUpdates` — change log for project progress
  - fields: _id, projectId (ObjectId), authorId, role, updateType (PROGRESS|STATUS|DELAY|QA), percentComplete, notes, photos[], createdAt
  - indexes: { projectId:1, createdAt:-1 }, { projectId:1, updateType:1 }

- `SiteVisitReports` — inspector visit records
  - fields: _id, projectId, inspectorId, visitDate, weather, activities[], photos[], geoLocation, issues[], recommendations, createdAt
  - indexes: { projectId:1, visitDate:-1 }, { inspectorId:1 }

- `MonitoringReports` — aggregated metrics (cached)
  - fields: _id, projectId, weekStart, metrics: { visitsCount, delayedDays, completionRequests }, generatedAt
  - indexes: { projectId:1, weekStart:1 }

Notes: reuse existing `Project`, `InspectionReport`, and design package relations. Store photos as `DesignFile` or `Media` refs to avoid duplication.

---

## 3) Backend: Models & Indexes
- Add Mongoose models: `ProjectUpdate`, `SiteVisitReport`, `MonitoringReport` under `backend/src/models/`.
- Indexes: projectId compound indexes, TTL indexes for ephemeral caches (MonitoringReport with TTL optional).
- Validation rules: required `projectId` (ObjectId), `inspectorId` must exist, photos array max length, photo URL validation regex, percentComplete 0–100.
- ACL: only `INSPECTION_TEAM` or `CONTRACTOR` (as allowed) can create SiteVisitReports; `ADMIN` can view all.

---

## 4) Backend: API Design (examples)
- GET `/api/monitoring/projects/:projectId/summary` — returns aggregated metrics and last updates
  - auth: token; access: project stakeholders or admins

- GET `/api/monitoring/projects` ?status=delayed&page=1 — list projects under monitoring with filters

- POST `/api/monitoring/projects/:projectId/updates` — create `ProjectUpdate`
  - body: { updateType, percentComplete, notes, photos[] }

- POST `/api/monitoring/projects/:projectId/site-visits` — create `SiteVisitReport`
  - body: { visitDate, activities, photos, geoLocation, issues }

- POST `/api/monitoring/projects/:projectId/completion-request` — contractor requests completion

- GET `/api/monitoring/reports/weekly?weekStart=YYYY-MM-DD` — admin metrics

Validation: JSON schema for each endpoint; fail 400 for bad ObjectId or missing fields.

---

## 5) Frontend: Pages, Components, Widgets
Structure under `frontend/src/app/monitoring/`
- Pages:
  - `monitoring/dashboard/page.tsx` — overview of Projects Under Monitoring, KPIs
  - `monitoring/project/[id]/page.tsx` — project detail, timeline, latest SiteVisitReports and ProjectUpdates
  - `monitoring/visits/create/page.tsx` — inspector visit form (mobile-first)
  - `monitoring/requests/page.tsx` — completion requests list

- Components:
  - `MonitoringWidget` — small KPI card
  - `ProjectTimeline` — chronological list of updates
  - `VisitForm` — photo uploader, geo picker, notes
  - `PhotoGallery` — preview/zoom photos

- Dashboard Widgets:
  - Projects Under Monitoring count
  - Delayed Projects list
  - Weekly Site Visits chart
  - Pending Completion Requests

- Mobile Screens: simplified VisitForm, PhotoUpload modal, Compact dashboard list view

---

## 6) Database: Key Collections (detailed)
- `ProjectUpdates` (document example)
  {
    projectId: ObjectId,
    authorId: ObjectId,
    role: 'CONTRACTOR'|'INSPECTION_TEAM'|'ADMIN',
    updateType: 'PROGRESS'|'DELAY'|'QA',
    percentComplete: Number,
    notes: String,
    photos: [ObjectId],
    createdAt: Date
  }

- `SiteVisitReports` (document example)
  {
    projectId: ObjectId,
    inspectorId: ObjectId,
    visitDate: Date,
    activities: [String],
    photos: [ObjectId],
    geoLocation: { lat, lng },
    issues: [String],
    recommendations: String,
    createdAt: Date
  }

- `MonitoringReports` (cached aggregates)
  {
    projectId: ObjectId,
    weekStart: Date,
    metrics: { visitsCount: Number, delayedDays: Number, avgCompletionPct: Number },
    generatedAt: Date
  }

---

## 7) Workflow (user flow)
Contractor Selected → Project Started → Inspector Site Visits → Progress Updates → Photo Uploads → Quality Checks → Delay Tracking → Completion Request

Implementation notes: each transition records a `ProjectUpdate` entry and triggers monitoring recalculation job.

---

## 8) Monitoring Dashboard Metrics
- Projects Under Monitoring, Delayed Projects, Projects On Schedule
- Weekly Site Visits, Avg visits per project
- Completion Requests pending/approved

---

## 9) Security & Validation Rules
- All endpoints require JWT. Use `authorizeRoles()` to restrict write operations.
- Validate ObjectId with mongoose.Types.ObjectId.isValid.
- Photo URLs must be trusted (basic regex) or use signed upload workflow (recommended). Limit file count per upload to 20.

---

## 10) Estimated File List (backend + frontend)
Backend (examples)
- backend/src/models/ProjectUpdate.ts
- backend/src/models/SiteVisitReport.ts
- backend/src/models/MonitoringReport.ts
- backend/src/controllers/monitoring.controller.ts
- backend/src/routes/monitoring.routes.ts
- backend/src/services/monitoringJob.ts (scheduler)

Frontend (examples)
- frontend/src/app/monitoring/page.tsx
- frontend/src/app/monitoring/dashboard/page.tsx
- frontend/src/app/monitoring/project/[id]/page.tsx
- frontend/src/components/monitoring/MonitoringWidget.tsx
- frontend/src/components/monitoring/VisitForm.tsx

---

## Acceptance criteria
- All APIs pass unit tests and smoke tests.
- Monitoring dashboard shows accurate metrics for test projects.
- Access controls enforced for create/update operations.

---

Please review this plan. I will not start coding until you approve. If you'd like, I can convert this into a task list (tasks.json) or a PR template next.
