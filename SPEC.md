# Pedro's Task Management System — Feature Spec

*Draft v0.1 — 2026-02-02*

---

## Core Philosophy

- **Constraint-first**: The system helps you do less, better
- **Energy-aware**: Matches work to your state
- **Learning**: Gets smarter about your patterns over time
- **API-native**: Built for automation from day one

---

## 1. Information Architecture

### Hierarchy

```
Workspace (root)
├── Inbox (special - quick capture)
├── Folders
│   └── Projects
│       └── Tasks
└── Goals (optional layer)
```

### Entities

| Entity | Description |
|--------|-------------|
| **Folder** | Container for related projects (e.g., "Clients", "Personal", "Products") |
| **Project** | A body of work with its own columns/workflow (e.g., "Organic Pulse", "Admin") |
| **Task** | Single actionable item |
| **Goal** | Outcome that tasks ladder up to (optional, for strategic visibility) |
| **Time Block** | Scheduled chunk on calendar |
| **Time Entry** | Tracked time (start/stop or manual) |

---

## 2. Projects & Folders

### Folders
- Create, rename, delete, reorder
- Collapse/expand in sidebar
- Color or icon per folder
- Archive entire folder (hides but preserves)

### Projects
- Live inside folders (or at root)
- Each project has:
  - Name, description, color/icon
  - Custom columns (see below)
  - Default view (board/list/calendar)
  - Archive toggle
  - Time tracking summary (total hours)

### Custom Columns (Per Project)

You define the workflow. Defaults provided but fully editable.

**Default columns (Kanban-style):**
- Backlog
- To Do
- In Progress
- Done

**Column properties:**
- Name
- Color
- Position (drag to reorder)
- "Counts as done" toggle (for archiving/stats)
- WIP limit (optional constraint)

**UX:**
- Drag tasks between columns
- Click column header to edit
- "+" to add column
- Columns persist per project (not global)

---

## 3. Tasks

### Core Fields (Always Present)

| Field | Type | Notes |
|-------|------|-------|
| Title | text | Required |
| Description | rich text | Markdown support |
| Column/Status | select | From project's columns |
| Due date | date | Optional |
| Scheduled date | date | "When to work on it" vs "when it's due" |
| Energy level | low/medium/high | What energy does this need? |
| Context tags | multi-select | e.g., "deep-work", "admin", "calls", "errand" |
| Time estimate | duration | Optional |
| Recurrence | rule | See recurring tasks |
| Project | reference | Which project it belongs to |
| Goal | reference | Optional link to goal |
| Created at | timestamp | Auto |
| Completed at | timestamp | Auto when moved to done column |

### Custom Fields (Per Project)

Projects can add custom fields:
- Text
- Number
- Select (single)
- Multi-select
- Date
- Checkbox
- URL

**UX:** Project settings → "Custom fields" → Add/edit/remove

### Task Actions

- Create (quick add or full form)
- Edit (inline or modal)
- Move to column (drag or dropdown)
- Move to project
- Duplicate
- Archive (soft delete)
- Delete (hard delete, confirm)
- Add to today
- Schedule (pick date)
- Start timer
- Add time entry (manual)

---

## 4. Views

### 4.1 Inbox

- Zero-friction capture
- Just title + optional note
- No project, no due date required
- "Triage" action: assign project + column in one click
- Keyboard shortcut to open from anywhere (global hotkey)
- Clear inbox = satisfying

**UX:**
- Cmd+N → Inbox opens, cursor in title field
- Enter to save, Cmd+Enter to save and open full editor
- Inbox count badge in sidebar

### 4.2 Today View (Focus Mode)

**This is the most important view.**

Shows:
1. Tasks scheduled for today
2. Tasks due today (auto-included)
3. Manually added tasks ("Add to today")
4. Calendar blocks for today (from time blocking)
5. Current energy level indicator

**Constraints:**
- Hard limit: max 7 tasks visible (configurable)
- If >7, forces you to defer some to tomorrow
- "Overflow" section shows what didn't make the cut

**UX:**
- Clean, minimal
- Drag to reorder priority
- Check off → satisfying animation
- Timer start button per task
- Energy indicator at top (click to update)

### 4.3 Board View (Per Project)

- Columns as vertical lanes
- Tasks as cards
- Drag between columns
- Filter by: tags, energy, due date, assignee (future)
- Search within project
- WIP limits shown per column

### 4.4 List View (Per Project)

- Traditional list
- Sortable by any field
- Groupable by column, due date, energy, tags
- Bulk actions (multi-select)

### 4.5 Calendar View

**Two layers:**
1. **Time blocks** (your planned schedule)
2. **Google Calendar events** (synced, read-only display or 2-way)

**Features:**
- Week view (default), day view, month view
- Drag to create time block
- Drag task from sidebar onto calendar = create time block
- Resize blocks
- Color by project or energy level
- Google Calendar events shown alongside (different styling)

**Time Block properties:**
- Linked task (optional)
- Linked project (if no specific task)
- Start/end time
- Recurrence
- Notes

### 4.6 Weekly Review View

Dedicated view for weekly review ritual:

1. **Past week summary**
   - Tasks completed (count + list)
   - Time tracked (by project)
   - Goals progress
   - Energy patterns (graph)

2. **Inbox cleanup**
   - Force triage of all inbox items

3. **Upcoming week**
   - Calendar preview
   - Unscheduled tasks with due dates
   - Prompt: "What are your 3 priorities this week?"

4. **Reflection prompts**
   - "What went well?"
   - "What didn't?"
   - "What to change?"
   - (Saved as weekly note, searchable later)

**UX:**
- Triggered manually or via reminder (Sunday evening?)
- Guided flow, not overwhelming
- Takes 10-15 minutes
- Ends with "Week planned" confirmation

### 4.7 Archive View

- All archived tasks, searchable
- Filter by project, date range, tags
- Restore action
- Export option

---

## 5. Time Tracking

### Start/Stop Timer

- Click "Start" on any task → timer begins
- Timer visible in top bar (always)
- Click to pause/stop
- Stopping prompts: "Log this time?" with editable duration
- Can switch tasks (auto-stops previous)

### Manual Entry

- Add time entry without timer
- Pick task, duration, date, optional notes
- Useful for logging after the fact

### Project Timer

- Start timer for a project (no specific task)
- "Working on Organic Pulse" without picking a task
- Logged as project-level time

### Time Reports

- By project: total hours, breakdown by task
- By day/week/month
- By tag/context
- Exportable (CSV, JSON)

### Integrations (Future)

- Toggl import
- Clockify import

---

## 6. Energy Tracking

### Quick Energy Check-In

- Floating button or hotkey
- "How's your energy right now?"
- 3 levels: 🔋 Low | ⚡ Medium | 🔥 High
- One click, done
- Logged with timestamp

### Energy on Tasks

- Each task has "energy required" field
- Low (admin, rote work)
- Medium (normal focus)
- High (deep work, creative)

### Smart Suggestions

Over time, the system learns:
- Your energy patterns by time of day
- Your energy patterns by day of week
- Suggests: "It's 2pm Tuesday, usually low energy — here are your low-energy tasks"

### Energy Graph

- Visualization of logged energy over time
- Overlay with productivity (tasks completed, time tracked)
- Spot patterns

---

## 7. Recurring Tasks

### Recurrence Rules

- Daily
- Weekly (pick days)
- Monthly (pick date or "first Monday", etc.)
- Custom interval (every X days)
- After completion (X days after last completion)

### Behavior

- Recurring task = template
- Generates instance when due
- Completing instance doesn't affect future occurrences
- Can edit single instance or all future
- Skip instance option

### UX

- Set recurrence when creating/editing task
- Visual indicator on recurring tasks
- "Recurring" filter in views

---

## 8. Google Calendar Sync (2-Way)

### From Google → App

- Events appear in calendar view
- Read-only by default
- Optional: create task from event
- Conflict detection with time blocks

### From App → Google

- Time blocks sync as events
- Option per block: "Show in Google Calendar?"
- Sync settings: which calendar(s), event visibility, reminders

### Sync Settings

- Connect Google account (OAuth)
- Select calendars to show
- Select calendar for outbound sync
- Sync frequency (real-time via webhook ideal, fallback to polling)

### Conflict Handling

- If Google event overlaps time block, show warning
- Option to auto-adjust or keep both

---

## 9. Goals / Outcomes Layer

### Goal Properties

- Title
- Description
- Target date (optional)
- Key results / milestones (optional sub-items)
- Linked projects
- Status: Active / Achieved / Abandoned

### Linking

- Tasks can link to a goal
- Projects can link to a goal
- Goal view shows all linked items + progress

### Goal Review

- Part of weekly review
- "Are you making progress on your goals?"
- Visual: tasks completed toward each goal

---

## 10. Quick Capture & Global Hotkey

### Global Hotkey (Desktop)

- Cmd+Shift+T (or configurable)
- Opens quick capture from anywhere (even other apps)
- Minimal window: just title field
- Enter to save to inbox
- Tab to add more fields

### Quick Add Within App

- Cmd+N from anywhere
- Context-aware: if in a project, defaults to that project
- "+" button in views

### Capture From Other Sources (Future)

- Browser extension
- Email forwarding
- API endpoint for integrations

---

## 11. Sidebar & Navigation

### Sidebar Structure

```
[Search]

📥 Inbox (3)
📅 Today (5/7)
📆 Upcoming
🔁 Recurring

──────────────

📁 Folders
├── 📂 Products
│   ├── Organic Pulse
│   └── SynthRes
├── 📂 Clients
│   └── PokerEdge
└── 📂 Personal
    ├── Admin
    └── Health

──────────────

🎯 Goals
📊 Reports
⏱️ Time Tracking
📦 Archive
⚙️ Settings
```

### Quick Switcher

- Cmd+K → Opens command palette
- Search projects, tasks, actions
- "Go to...", "Create...", "Start timer for..."

---

## 12. Settings & Preferences

### General

- Timezone (auto-detect or manual)
- Start of week (Sun/Mon)
- Default view (Today/Board/List)
- Theme (Light/Dark/System)

### Today View

- Max tasks limit (default 7)
- Auto-include due today (on/off)
- Show calendar blocks (on/off)

### Notifications

- Daily brief (morning summary)
- Upcoming due date reminders
- Weekly review reminder
- Timer running too long alert

### Integrations

- Google Calendar connection
- API keys management
- Webhooks (outbound)

### Data

- Export all (JSON, CSV)
- Import (from TickTick, Todoist, etc.)
- Danger zone: delete account

---

## 13. API

### Design Principles

- REST + JSON
- Auth via API key (Bearer token)
- Rate limited but generous
- Webhooks for real-time events

### Core Endpoints

```
# Tasks
GET    /tasks                 # List (filterable)
POST   /tasks                 # Create
GET    /tasks/:id             # Get one
PATCH  /tasks/:id             # Update
DELETE /tasks/:id             # Delete
POST   /tasks/:id/complete    # Mark complete
POST   /tasks/:id/timer/start # Start timer
POST   /tasks/:id/timer/stop  # Stop timer

# Projects
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
GET    /projects/:id/tasks

# Folders
GET    /folders
POST   /folders
...

# Time Entries
GET    /time-entries
POST   /time-entries
...

# Energy Logs
GET    /energy
POST   /energy               # Log energy level

# Calendar
GET    /calendar/blocks
POST   /calendar/blocks
...

# Webhooks
POST   /webhooks             # Register webhook
DELETE /webhooks/:id
```

### Webhook Events

- task.created
- task.updated
- task.completed
- task.deleted
- timer.started
- timer.stopped
- energy.logged
- review.completed

### Kai Integration Specifically

With this API, I can:
- Check your tasks due today
- Create tasks from emails/messages
- Start/stop timers
- Log energy on your behalf
- Pull time tracking reports
- Remind you about overdue items
- Include task context in daily briefs

---

## 14. UX Principles

### Speed

- Everything keyboard-accessible
- Instant search (local-first)
- No loading spinners for common actions
- Offline-capable (sync when back online)

### Constraints That Help

- Today view task limit
- WIP limits on columns
- Inbox forces triage
- Weekly review is guided, not skippable

### Satisfaction

- Checking off tasks feels good (animation, sound optional)
- Progress indicators
- Streaks? (optional, can be turned off)
- "You completed X tasks this week" celebrations

### Minimalism

- Hide what you don't use
- Progressive disclosure
- Settings are advanced, defaults are good

---

## 15. Tech Stack (Suggestions)

For desktop-first, mobile-ready, offline-capable:

**Option A: Web + Electron**
- Frontend: React/Vue + TypeScript
- Desktop: Electron wrapper
- Mobile: PWA or React Native later
- Backend: Node.js or Go
- Database: PostgreSQL + local SQLite for offline
- Sync: CRDTs or custom sync protocol

**Option B: Native + Shared Backend**
- Desktop: Tauri (Rust + Web frontend) — lighter than Electron
- Backend: Same
- More performant, smaller bundle

**Option C: Local-First (Extreme)**
- Use something like ElectricSQL or Evolu
- All data local, sync via CRDT
- Backend just for sync + auth
- Maximum offline capability

---

## 16. MVP Scope

For a first working version, prioritize:

### Must Have (MVP)
- [ ] Projects with custom columns
- [ ] Tasks with core fields
- [ ] Board view
- [ ] List view
- [ ] Today view with task limit
- [ ] Inbox + quick capture
- [ ] Basic time tracking (start/stop)
- [ ] Local storage (offline-first)
- [ ] API (basic CRUD)

### Should Have (v1.0)
- [ ] Folders
- [ ] Calendar view + time blocking
- [ ] Google Calendar sync (read)
- [ ] Recurring tasks
- [ ] Energy tracking
- [ ] Keyboard shortcuts
- [ ] Global hotkey capture

### Nice to Have (v1.x)
- [ ] Google Calendar 2-way sync
- [ ] Weekly review view
- [ ] Goals layer
- [ ] Energy pattern learning
- [ ] Import from TickTick
- [ ] Webhooks

---

## Open Questions

1. **Name?** (Working title needed)
2. **Self-hosted or SaaS?** (Guessing self-hosted / local-first given your preferences)
3. **Collaboration ever?** (You said solo, but future-proofing?)
4. **Mobile app priority?** (PWA acceptable or native needed?)
5. **AI features?** (Auto-categorization, smart scheduling, natural language input?)

---

*This is a living doc. Update as we refine.*
