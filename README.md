# Ticket Management Portal

> This document will change throughout the development process. Unresolved decisions are listed at the end.

> Accessing a list of all the backend endpoints for testing can be done through http://localhost:8080/swagger-ui.html

## Overview

The Ticket Management Portal allows users to submit and track IT tickets, communicate with support agents, and view ticket history. The system automatically assigns new tickets to support agents based on workload. Administrators oversee tickets, manage accounts, and reassign tickets when necessary.

The system has three roles:

- **User** — submits and tracks their own tickets.
- **Support Agent** — handles assigned tickets.
- **Administrator** — manages users, agents, and all tickets.

## Ticket list pagination

`GET /tickets`, `GET /tickets/status/{status}`, `GET /tickets/creator/{creatorId}`,
and `GET /tickets/assignee/{assigneeId}` accept Spring Data pagination parameters:

| Parameter | Default        | Description                                                    |
| --------- | -------------- | -------------------------------------------------------------- |
| `page`    | `0`            | Zero-based page index                                          |
| `size`    | `5`            | Tickets per page (maximum `2000`)                              |
| `sort`    | `ticketId,asc` | Entity property and direction; repeat for multiple sort fields |

For example: `/tickets/status/IN_QUEUE?page=1&size=10&sort=createdAt,desc&sort=ticketId,asc`.
Use a unique field such as `ticketId` as the final sort field for predictable ordering.

List responses are now page objects rather than bare arrays. Tickets are in
`content`, with `number`, `size`, `totalElements`, `totalPages`, `first`, and
`last` describing the page. An out-of-range page has empty `content` but retains
the matching total. Single-ticket and mutation responses are unchanged.

## Admin dashboard

Administrators see a dedicated dashboard at `/dashboard`. It loads live totals
from `GET /admin/dashboard`, protected by both HTTP and service-level admin
authorization. Other roles retain their own dashboards.

The overview shows all-time ticket counts by status, open tickets by priority,
active support agents, account totals, and the five
newest tickets (ordered by creation time, then ID). The resolved
percentage is resolved tickets divided by all tickets, including cancelled ones.
Account totals include inactive accounts and administrators; the regular-user
and support-agent totals are shown separately. Refresh reloads the summary.

Ticket details show the creator's email and the assigned support agent's email,
or "Not assigned yet" when unassigned. Ticket API responses include `creatorEmail`
and the nullable `assigneeEmail` field.
Ticket details use the same back-link style as account details; administrators
return to the dashboard or account page they opened the ticket from. The new
support-agent form reuses the registration card styles and matching-password
validation, then returns to the agents list after successful creation.

The regular-user dashboard's recent tickets and the admin dashboard's latest
tickets share the same responsive row layout, status and priority badges, and
creation dates. Each row includes a **View** button that opens that ticket's
details.

## Running with Docker

MySQL and Spring Boot run in Docker containers. Angular currently runs locally.

### Prerequisites

- Docker Desktop.
- A local `backend/.env` file containing the variables referenced in `compose.yaml`. Copy `/.env.example` into `backend/`, and change placeholder values.
- Run all commands below from the repository root.

### Configuration

`--env-file ./backend/.env` supplies values for variable substitution in `compose.yaml`. The service's `environment` mappings pass the required values into its container.

Validate Compose configuration:

```powershell
docker compose --env-file ./backend/.env config --quiet
```

`--quiet` ommits printout.
MySQL initialization variables create the database and user only when initializing an empty data directory. Changing `.env` does not update credentials in an existing database.

Use `up --build` after changing backend code.
The backend image build skips tests. Run the Maven verification checks separately before building. From `/backend/`:

```powershell
./mvnw.cmd verify
```

### Start the application

Build the backend image and start services:

```powershell
docker compose --env-file ./backend/.env up --build -d
```

Start existing containers without rebuilding the image:

```powershell
docker compose --env-file ./backend/.env up -d
```

After backend code changes, rebuild and recreate the backend container:

```powershell
docker compose --env-file ./backend/.env up --build -d backend
```

### Status and logs

Show service status and published ports:

```powershell
docker compose --env-file ./backend/.env ps
```

Follow backend logs:

```powershell
docker compose --env-file ./backend/.env logs -f backend
```

### Stop the application

Stop containers while keeping them available for reuse:

```powershell
docker compose --env-file ./backend/.env stop
```

Remove containers and the Compose network while preserving database data:

```powershell
docker compose --env-file ./backend/.env down
```

### Connection addresses

| Connection                       | Address                          |
| -------------------------------- | -------------------------------- |
| Local Angular/browser -> backend | `http://localhost:8080`          |
| IntelliJ -> MySQL                | `localhost:3306`                 |
| Backend container -> MySQL       | `jdbc:mysql://db:3306/<db-name>` |

### Develop using IntelliJ

To run Spring Boot from IntelliJ, stop the backend container first to
free port `8080`:

```powershell
docker compose --env-file ./backend/.env stop backend
docker compose --env-file ./backend/.env up -d db
```

Start SB from IntelliJ using the local database address
`localhost:3306` and the required environment variables.

### Development seeding

Development seeding is disabled by default. It runs at startup only when both the
`dev` Spring profile is active and `app.seed.enabled=true`. When enabled,
`app.seed.password` must be supplied externally, otherwise
startup fails, even if all seed accounts already exist. There is no default
seed password.

| Email                          | Role            |
| ------------------------------ | --------------- |
| `admin@example.com`            | `ADMIN`         |
| `zika@example.com`             | `SUPPORT_AGENT` |
| `nikola@example.com`           | `SUPPORT_AGENT` |
| `agent3@example.com`           | `SUPPORT_AGENT` |
| `petar.petrovic@example.com`   | `USER`          |
| `vojin.vojinovic@example.com`  | `USER`          |
| `andjela.petrovic@example.com` | `SUPPORT_AGENT` |
| `emily.wilson@example.com`     | `SUPPORT_AGENT` |
| `vesna.jovanovic@example.com`  | `USER`          |
| `sarah.parker@example.com`     | `USER`          |

Each email is checked independently. Only missing accounts are inserted, in
one transaction. Restarting or changing the seed password does not overwrite
existing passwords, roles, or other account data.

The same runner seeds users first, validates the existing `INCIDENT` and
`SOFTWARE_REQUEST` enum types (there are no type rows to insert), then creates
28 tickets numbered `TKT-SEED-0001` through `TKT-SEED-0028`. The original eight fixtures are preserved; tickets 9–28 add 20 deterministic scenarios across all four regular users and five support agents. Both ticket types and all `TicketPriority` values (`LOW`, `MEDIUM`, `HIGH`) are represented. Seed assignments are not workload-based, and users are resolved by email with their actual roles checked. A missing user or unexpected role fails seeding.

| Tickets                            | Final status  | Comments per ticket       | Special history                                |
| ---------------------------------- | ------------- | ------------------------- | ---------------------------------------------- |
| 1–2                                | `RESOLVED`    | 3, 2                      | Resolution summaries; ticket 2 reassigned      |
| 3–5                                | `FULFILLMENT` | 1 each                    | Ticket 4 reassigned                            |
| 6–7                                | `FULFILLMENT` | 0                         | Initial assignment                             |
| 8                                  | `CANCELLED`   | 0                         | Admin cancellation                             |
| 9, 12, 15, 18, 21, 23, 26, 28      | `RESOLVED`    | 3, 2, 1, 2, 3, 2, 1, 3    | Resolution summaries; 9, 12, 21, 28 reassigned |
| 10, 11, 13, 16, 17, 20, 22, 25, 27 | `FULFILLMENT` | 1, 0, 2, 2, 0, 0, 1, 1, 0 | 16 and 25 reassigned                           |
| 14, 19, 24                         | `CANCELLED`   | 1, 2, 0                   | Admin cancellation; 19 reassigned              |

On an empty database this creates 10 accounts, 28 tickets (14 in fulfillment,
10 resolved, 4 cancelled), 35 comments, and 142 history events, including nine
reassignments. Comments come from the ticket creator, assigned agent, or admin.
Each ticket has chronological, fixed timestamps for creation, assignment, comments,
and any reassignment or final status change; its last event matches `updatedAt`.
Resolution uses a single `RESOLVED` event rather than a duplicate status event.

Each ticket, its assignment, comments, and complete history are saved in one transaction. A failure rolls back that entire fixture and stops further seeding; earlier completed fixtures remain. Existing ticket numbers and all their children are skipped unchanged, even if their history is incomplete.

**Activation state:** Seeded accounts are created active, and existing accounts keep their activation state. `agent3@example.com` stays active because ticket fixtures are assigned to it. To try the inactive-agent scenario, deactivate it through the admin endpoint after its fixtures are resolved or reassigned. A fixture whose agent is inactive fails clearly; the seeder never reactivates accounts.

**IntelliJ:** In the Spring Boot run configuration, set the active profile to
`dev`. Add environment variables `APP_SEED_ENABLED=true` and
`APP_SEED_PASSWORD` with a locally chosen password, alongside the existing
database configuration. Remove `APP_SEED_ENABLED` or set it to `false` to disable seeding.

**Docker Compose:** In the local, untracked `backend/.env`, set
`SPRING_PROFILES_ACTIVE=dev`, `APP_SEED_ENABLED=true`, and `APP_SEED_PASSWORD`
to a locally chosen password.

The backend `environment` mappings in `compose.yaml` pass the seed variables into the
container.

From the repository root, apply these settings and rebuild after code changes:

```powershell
docker compose --env-file .\backend\.env up --build -d backend
```

After seeding, set `APP_SEED_ENABLED=false`, remove `APP_SEED_PASSWORD` from the
local file, and recreate the backend to remove the enabled settings from its
environment:

```powershell
docker compose --env-file .\backend\.env up -d --force-recreate backend
```

## System Scope

The initial system will support:

- User registration, email validation, authentication, and authorization.
- Login, logout, and password reset through email verification.
- Profile management.
- Ticket submission and automatic ticket-number generation.
- Automatic ticket assignment based on agent workload.
- Ticket tracking, searching, and filtering.
- Comments on tickets.
- Ticket status management and resolution.
- Ticket reassignment.
- Immutable ticket event history.
- User and support-agent administration.

The system will enforce **role-based authorization and method-level authorization**, including ownership and assignment checks.

### 2.1 Ticket Classification

| Category | Subcategories              |
| -------- | -------------------------- |
| IT       | Incident, Software Request |

### 2.2 Deferred Scope

- An optional HR category and its subcategories.
- A second version of automatic assignment that also considers the agent's sector.

These extensions are outside the initial implementation.

## Role-Based Features

### User

- Register an account.
- Log in and log out.
- Manage their own profile, subject to the profile rules still to be defined.
- Submit tickets.
- View their own tickets.
- Search and filter their own tickets.
- Comment on their own tickets.
- View the history of their own tickets.
- Cancel their own unresolved tickets.

### Support Agent

- View assigned tickets.
- Comment on assigned tickets.
- Start processing assigned tickets (`IN_QUEUE` to `FULFILLMENT`).
- Resolve assigned tickets by changing their status to `RESOLVED`.

### Administrator

- View and manage users.
- View and manage support agents.
- View all tickets.
- Reassign tickets.
- Change ticket statuses.
- Comment on any ticket, including when the assigned agent is unavailable.

### Access Boundaries

| Role          | Ticket access         | Administrative access                                 |
| ------------- | --------------------- | ----------------------------------------------------- |
| User          | Own tickets only      | No access to all-user lists or account administration |
| Support Agent | Assigned tickets only | No administrative access defined in this baseline     |
| Administrator | All tickets           | User and support-agent management                     |

The backend enforces this matrix at service entry points with `@PreAuthorize`
and shared ticket ownership/assignment checks:

| Operation                                                              | USER                   | SUPPORT_AGENT         | ADMIN                             |
| ---------------------------------------------------------------------- | ---------------------- | --------------------- | --------------------------------- |
| Create a ticket                                                        | As self                | As self               | As self                           |
| Read ticket details, comments, history; add comments                   | Own tickets            | Assigned tickets      | Any ticket                        |
| List/search/count tickets                                              | Own creator scope      | Own assignee scope    | Any scope, including global lists |
| Start processing                                                       | Denied                 | Assigned tickets only | Denied                            |
| Resolve                                                                | Denied                 | Assigned tickets only | Any ticket                        |
| Cancel                                                                 | Own unresolved tickets | Denied                | Any ticket                        |
| Reassign                                                               | Denied                 | Denied                | Any ticket                        |
| User/agent directories, other account details and related-ticket lists | Denied                 | Denied                | Allowed                           |
| Admin dashboard, agent registration, account deactivation              | Denied                 | Denied                | Allowed                           |
| Own profile and password change                                        | Allowed                | Allowed               | Allowed                           |

Registration and login remain public. Ticket creation remains available to all
three roles; subsequent access follows the relationship rules above, including
for tickets created by agents. Existing status-transition rules and inactive
assignee checks still apply.

Regular users may cancel their own tickets in `IN_QUEUE` or `FULFILLMENT`, but cannot resolve or reassign tickets. Support agents cannot cancel tickets; they may resolve only assigned tickets. Administrators may cancel, resolve, or reassign any unresolved ticket. Resolved and cancelled tickets remain terminal and reject further status changes or reassignment.

The controller-to-service audit covers authentication/profile operations, administration/dashboard operations, every ticket list/filter/count/queue and mutation, comments, and history. Query IDs are validated against the authenticated account; changing a creator/assignee ID cannot widen access.
Ticket creators, comment authors, and event initiators are derived from the authenticated principal in the service.

Internal event recording is separate from the history-reading service and requires an existing transaction. Ticket creation, automatic assignment and its events, and each later ticket or comment mutation with its event remain atomic.

## Diagrams

### Entity-Relationship Diagram

The initial ERD:

![Smart Ticket Management Platform initial ERD](docs/img/erd.png)

Optional entities/fields to add:

- **tickets.version**: for detecting conflicting updates by support agent and admin.

## Sequence Diagram

The initial sequence diagram for ticket submission and automatic assignment:

![Initial ticket submission and automatic assignment sequence diagram](docs/img/ticket_submission_and_assignment_sequence.png)

Backend ticket creation, assignment, and event saving are executed in a single transaction.

## Class Diagram

The initial class diagram:

**Domain classes:**

![Initial class diagram - domain classes](docs/img/domain_classes.png)

**Application services:**

![Initial class diagram - domain classes](docs/img/services.png)

## Functional Requirements

### FR-01 — Registration

The system shall allow users to create an account using:

- First name.
- Last name.
- Email address.
- Password.

The system shall support email validation. The verification flow and its effect on account access remain to be defined.

### FR-02 — Authentication and Logout

The system shall authenticate users using email and password.

The system shall support:

- Login using JWT-based authentication to secure API access. The JWT is delivered in an `HttpOnly` cookie (see [Authentication Cookie](#authentication-cookie)).
- Logout by having the server expire the authentication cookie (`POST /auth/logout`).
- Password reset through email verification.

**JWT clarification:** Plain logout only expires the cookie; it does not invalidate an already-issued JWT on the server. Every authenticated request checks the token's account, so a JWT is rejected with `401` when:

- the account was deactivated, or
- the account's password was changed after the token was issued (the `token_version` claim no longer matches).

Tokens issued before the `token_version` claim existed are also rejected, so users must log in again once. Refresh-token behavior remains to be defined.

#### Authentication Cookie

| Endpoint                     | Behavior                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/login`           | Returns `204 No Content` and sets the `access_token` cookie. The token is never in the response body.                                                                                |
| `POST /auth/logout`          | Returns `204 No Content` and expires the cookie (`Max-Age=0`).                                                                                                                       |
| `POST /auth/change-password` | Body `{currentPassword, newPassword}`. Returns `204 No Content`, expires the cookie and revokes every JWT issued for the account. The frontend must then redirect to the login page. |
| `GET /users/me`              | Returns the current user. The frontend calls it to restore the session after a page reload, because JavaScript cannot read the cookie.                                               |

Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, lifetime equal to `security.jwt.expiration-seconds`, and `Secure` controlled by `security.jwt.cookie-secure`.

Important:

- **Production:** set `security.jwt.cookie-secure=true` (HTTPS only). With the default `false`, the cookie also travels over plain HTTP.
- **Frontend requests must send credentials.** Cross-origin calls need `withCredentials: true` (Angular `HttpClient`). The allowed origin is set by `app.cors.allowed-origins` and must be an explicit origin, never `*`.
- **CSRF:** CSRF protection is disabled. Protection relies on `SameSite=Lax`, the CORS origin allow-list and JSON-only request bodies (which force a CORS preflight). Do not add state-changing `GET` endpoints. If the frontend and API end up on different sites, switch to `SameSite=None; Secure` and enable CSRF tokens.
- **Token sources:** the API reads the JWT from the cookie first and falls back to the `Authorization: Bearer` header, so Swagger UI and curl still work. Only public auth routes (`/auth/login`, `/auth/register`, `/auth/logout`) and documentation routes bypass token resolution, so a stale cookie cannot block login. `/auth/change-password` requires a valid cookie or Bearer token.
- **Secret:** `SECRET_KEY` must be at least 32 bytes. The application refuses to start otherwise. Generate one with `openssl rand -base64 48`.

### FR-03 — Profile Management

The system shall support profile management operations, originally described as CRUD: create, read, update, and delete.

Account creation is covered by FR-01.

**Account deactivation (soft delete):** `PATCH /admin/users/{userId}/deactivate` (ADMIN only) returns `200` with `{id, email, role, active}`.

- The account row and all tickets, comments, and events referencing it are preserved.
- Inactive accounts cannot log in, and their unexpired JWTs are rejected with `401`.
- Inactive support agents cannot be assigned or reassigned tickets (`409`).
- Repeating the request for an inactive account returns `200` without changes.
- An unknown user returns `404`.
- These cases return `409`:
  - deactivating an administrator, including yourself (this also protects the last administrator);
  - deactivating an agent that still has unresolved (`IN_QUEUE` or `FULFILLMENT`) assigned tickets.
- Reactivation is not supported yet.
- `active` is exposed only in admin responses (`POST /admin/support-agents` and deactivation), not in public registration.
- Schema change: `ddl-auto=update` adds `active` (default `true`, so existing accounts stay active) and `token_version` (default `0`).

### FR-04 — Ticket Creation

The system shall allow an authenticated user to submit a ticket under the IT category using one of these subcategories:

- Incident.
- Software Request.

The system shall automatically generate a unique ticket number and initiate automatic assignment after submission.

Required form fields and validation rules for each subcategory remain to be defined.

### FR-05 — Automatic Ticket Assignment

The first version shall automatically assign a new ticket to an active support agent with the smallest workload.

Whenever a ticket is created, the system shall:

1. Retrieve active support agents.
2. Count the active tickets assigned to each agent.
3. Sort agents by their active-ticket count.
4. Select an agent with the lowest count.
5. Assign the ticket to that agent.
6. Save a ticket-assignment event.

The definition of an active ticket, availability rules, tie-breaking, behavior when no agent is eligible, and concurrent assignment handling remain to be defined.

A later version may additionally consider the agent's sector.

### FR-06 — Ticket Search and Filtering

The system shall allow users to search and filter their own tickets.

Supported filter criteria shall include:

- Status.
- Ticket subcategory/type, when the filter is implemented.
- Priority.
- Creation date.

Regular users shall not be able to retrieve other users' tickets through search or filtering. Searchable text fields remain to be defined.

### FR-07 — Comments

The system shall allow:

- Users to comment on their own tickets.
- Support agents to comment on assigned tickets.
- Administrators to comment on any ticket.

Adding a comment shall create a `COMMENT_ADDED` event in the ticket history.

### FR-08 — Ticket Status Management

The system shall track each ticket's current status.

The working status names include:

- `IN_QUEUE`
- `FULFILLMENT`
- `RESOLVED`

The workflow also includes `CANCELLED`. Regular users may cancel their own
unresolved tickets, and administrators may cancel any unresolved ticket.
Support agents cannot cancel tickets. Cancellation records a `CLOSED` history event.

Support agents shall be able to resolve assigned tickets. Administrators shall be able to change ticket statuses. State changes shall be recorded in the ticket history.

### FR-09 — Ticket Reassignment

The system shall allow administrators to reassign tickets when necessary, such as when an agent is unavailable or a ticket requires escalation.

The system shall record reassignment in the ticket history.

Whether the administrator selects the replacement agent or triggers automatic selection remains to be defined. Support-level eligibility is not yet specified.

### FR-10 — Ticket Event Tracking

The system shall maintain immutable ticket history through ticket events.

The history shall make it possible to determine:

- Who created the ticket.
- When the ticket was assigned.
- Whether it was reassigned.
- Which statuses it passed through.
- Who resolved it.
- When it was resolved.

Recorded events shall not be editable. See Section 6 for the event types.

### FR-11 — User and Support-Agent Management

The system shall allow administrators to view and manage users and support agents.

The exact management operations and their effects on existing tickets remain to be defined.

## Workflows

### General Ticket Workflow

1. A user registers an account and logs in.
2. The user submits an Incident or Software Request ticket.
3. The system generates a ticket number and automatically assigns the ticket based on agent workload.
4. The assigned support agent works on the ticket.
5. The user and assigned agent communicate through comments.
6. An administrator may comment, change status, or reassign the ticket when necessary.
7. The agent resolves the ticket.
8. The ticket reaches closure according to rules still to be defined.
9. Ticket events preserve the history throughout the workflow.

### User Workflow

Login → Create ticket → Automatic assignment → Track status and add comments → Resolution → Closure.

Automatic assignment and resolution are system/agent actions visible to the user. The actor responsible for closure remains to be confirmed.

### Support-Agent Workflow

View assigned tickets → Fulfill the request or investigate the incident → Comment as needed → Resolve the ticket.

Opening a pending (`IN_QUEUE`) ticket's details as its assigned support agent
automatically starts processing and moves it to in progress (`FULFILLMENT`).
Only the assigned support agent may perform this agent-only transition;
viewing the ticket as another agent, a regular user, or an administrator does
not change its status. Administrators can resolve or cancel tickets but cannot
start them. Reassigning an in-progress ticket returns it to pending; an already
pending ticket stays pending. Both status transitions are recorded in ticket
history.

### Administrator Workflow

Monitor tickets → Review the need for intervention → Reassign, comment, or change status as needed.

Administrators also manage user and support-agent accounts independently of the ticket lifecycle.

## Ticket Events and History

**Ticket events collectively form the ticket history.**

The proposed `eventType` field is a string with the following values:

| Event type       | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| `CREATED`        | A ticket was submitted.                                 |
| `ASSIGNED`       | A ticket received its initial support-agent assignment. |
| `STATUS_CHANGED` | A ticket's status changed.                              |
| `COMMENT_ADDED`  | A comment was added.                                    |
| `REASSIGNED`     | A ticket was reassigned to another support agent.       |
| `RESOLVED`       | A ticket was resolved.                                  |
| `CLOSED`         | A ticket was closed.                                    |

Events need enough information to identify the ticket, when the event occurred, who or what performed it, and the relevant change. System-generated actions must be distinguishable from user actions.

It must be decided whether resolution and closure produce both a `STATUS_CHANGED` event and a specialized event, or only the specialized event.

## Playwright Tests

The `playwright/` folder contains three projects:

| Project | Folder              | Purpose                                                    |
| ------- | ------------------- | ---------------------------------------------------------- |
| `API`   | `tests/api`         | Backend endpoint tests (default `http://localhost:8080`).  |
| `UI`    | `tests/ui`          | Browser tests: login, tickets, ticket details, dashboard.  |
| `E2E`   | `tests/e2e`         | Full user and support-agent flows in the browser.          |

### Prerequisites

Start the backend (port 8080) and the Angular development server (port 4200)
before running browser tests. The Angular server proxies `/api` requests to the
backend. Tests sign in with the seeded accounts defined in
`playwright/test-data/user.data.ts` (see [Development seeding](#development-seeding)).

### Running

```powershell
cd playwright
npx playwright test --project=UI
npx playwright test --project=E2E
npx playwright show-report
```

### E2E flows

- **User:** registers a new account, logs in, creates a ticket via the
  *Create Ticket* tab, finds it in *My Tickets* and checks the assigned agent.
- **Support agent:** a new ticket is created through the API, the assigned
  agent logs in, opens it from the dashboard Priority Queue, posts two comments
  and resolves it. The test is skipped if the ticket is not among the top 5
  queue entries.

### Test data

Tests create uniquely named users, tickets and comments in the configured
backend; these records are not deleted automatically. Do not run them against
production data.

## Decisions to Confirm

These items clarify incomplete requirements; they do not introduce additional committed functionality.

1. **Automatic assignment:** Active-ticket definition, availability criteria, tie-breaking, no-agent handling, and concurrency behavior.
2. **Reassignment:** Manual replacement selection versus automatic selection, and whether support levels exist in the baseline.
3. **Ticket forms:** Required fields and validation for Incident and Software Request.
4. **Authentication:** Email verification behavior, password-reset flow, JWT expiry, and logout/revocation semantics.
5. **History:** How specialized status events relate to `STATUS_CHANGED`.
