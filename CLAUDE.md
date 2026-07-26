# Spelling Bee Web App - Project Context Prompt for Claude Code

Copy and paste this entire prompt into Claude Code to provide full project context before running component-specific prompts.

---

## PROJECT OVERVIEW

I'm building a web app for hosting live spelling bees. The app has two distinct interfaces:

1. **Host Panel** (authenticated, private): The spelling bee organizer controls the game. They create the bee, manage participants, and input spelling attempts in real-time.
2. **Display Client** (public, gamekey-based): A read-only view displayed on a projector or shared screen for the audience/participants to watch.

The app uses a gamekey (random string like `BEE-A7F2K9`) to connect host and display without requiring the display to authenticate.

---

## GAME FLOW

1. Host logs in and creates a spelling bee (title only)
2. Host builds out the bee round by round: add a round, then set that round's word list — repeated for as many rounds as the bee needs. `totalRounds` is derived from however many rounds have been added, not chosen up front.
3. Host clicks "Start Bee" → system generates a unique gamekey (requires at least one round, each with a non-empty word list)
4. Display operator joins via gamekey on a separate device (no login needed)
5. Host enters participant names one by one
6. Host clicks "Ready" → both host and display show "Round 1 • [Participant Name]'s turn"
7. Host types the spelling as the participant spells it aloud → display shows the typing in real-time
8. Host presses Enter → display shows the correct spelling + "CORRECT" or "INCORRECT" badge
   - **If correct**: Participant advances to the next round
   - **If incorrect**: Participant is eliminated from the current round
9. Display shows next participant, repeat until all participants in the round have spelled
10. At round end, host can add new participants and click "Next Round"
11. Game ends when all rounds are complete or only 1 participant remains
12. Display shows final winner and standings

---

## TECHNOLOGY STACK

**Frontend:**
- React + TypeScript
- Socket.io-client for real-time sync
- Tailwind CSS for styling
- Single app with two route-based views: `/host/*` (protected) and `/display/:gamekey` (public)

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- Socket.io for WebSocket real-time communication
- JWT authentication (host only)

**Database:**
- PostgreSQL with Prisma migrations

---

## DATABASE SCHEMA

### Core Tables:

**users**
- id (INT, PK, auto-increment)
- email (unique)
- passwordHash
- createdAt

**spelling_bees**
- id (INT, PK, auto-increment)
- userId (FK → users)
- title (VARCHAR)
- totalRounds (INT, default 0) — derived automatically as rounds are added via the round-builder endpoint; the host never sets this directly
- gamekey (VARCHAR, unique, generated on start)
- status (ENUM: created | in_progress | completed)
- currentRound (INT, default 0)
- createdAt

Word data is not stored on the bee — it lives entirely on each bee_round (see below), and rounds no longer need an equal word count.

**Building a bee's rounds**: creating a bee no longer accepts rounds or words up front. The host builds a bee in three steps: (1) create the bee (title only), (2) add a round (creates a `bee_round` row with an empty word list and bumps `totalRounds`), (3) set that round's word list (overwrites `assignedWords`). Steps 2–3 repeat per round. Adding rounds/words is only allowed while the bee is still in the `created` status. Starting the bee validates that at least one round exists and that every round has a non-empty word list.

**participants**
- id (INT, PK, auto-increment)
- beeId (FK → spelling_bees)
- name (VARCHAR)
- isActive (BOOLEAN, whether the participant still needs to take a turn in the current round — reset to true for all non-eliminated participants at the start of each round)
- isEliminated (BOOLEAN, whether eliminated from the bee entirely)

**bee_rounds**
- id (UUID, PK)
- beeId (FK → spelling_bees)
- roundNumber (INT)
- assignedWords (JSON array of words for this round — starts as an empty array when the round is added, populated by a separate "set round words" call; length can vary per round)

Spelling attempts (responses) are not persisted: each attempt is checked against the current round's assigned word in real time and only the outcome (isActive/isEliminated on the participant) is written back. Nothing about individual attempts survives past that check.

**Relationships:**
```
users (1) ──→ (many) spelling_bees
spelling_bees (1) ──→ (many) participants
spelling_bees (1) ──→ (many) bee_rounds
```

---

## WEBSOCKET EVENTS (Socket.io)

**Host emits to Display (via gamekey room):**
- `round:start` → { roundNumber, participantName }
- `word:revealed` → { word, participantName } (host only sees this, display doesn't see word yet)
- `typing:update` → { currentSpelling } (real-time as host types)
- `response:submitted` → { word, userSpelling, isCorrect, participantName }
- `participant:eliminated` → { participantName }
- `round:end` → { advancedParticipants: [] }
- `bee:completed` → { winner, finalStandings: [] }
- `participant:added` → { name } (when host adds new participant mid-round)

**Display/Host receive:**
- Display listens to all host events and updates its view
- Both acknowledge connection: `client:connected` → { gamekey }

---

## FRONTEND STRUCTURE

**Routes:**
- `/auth/login` - Host login page
- `/auth/register` - Host registration page
- `/host/create` - Create new bee form
- `/host/bees` - List host's bees
- `/host/:beeId/control` - Main control panel (protected by JWT)
- `/display/:gamekey` - Public display view (no auth, gamekey-based)

**Host Control Panel Components:**
- Bee config form (title only)
- Round builder: add a round, then enter/paste that round's word list; repeat per round. `totalRounds` is just a read-only count of rounds added so far.
- Gamekey display + copy button (shown after bee starts)
- Current round indicator
- Current participant name display (large, prominent)
- Current word display (only visible to host, not shown to display)
- Text input field for typing spelling (visible to host, synced in real-time to display)
- Submit button / Enter key handler
- Skip button
- Participants list (Active vs Eliminated tabs)
- Live standings table
- Add Participant modal (triggered at round start)
- Next Round button

**Display Client Components:**
- Gamekey join page (input field + join button)
- Round indicator (large)
- Current participant name (large)
- Live spelling display (shows what host is typing, updates in real-time)
- Verdict badge (CORRECT / INCORRECT, shown after submission)
- Correct spelling display (shown after submission)
- Round results screen (who advanced to next round)
- Winner announcement screen (final standings)
- Disconnection notice + reconnect UI

---

## KEY GAME LOGIC RULES

1. **Bee building**: Creating a bee takes only a title. Rounds and their word lists are added afterward, one round at a time (add round → set that round's words). `totalRounds` is derived from the number of rounds added, not specified by the host. Rounds/words can only be edited while the bee is in the `created` status; starting the bee requires at least one round, each with a non-empty word list.
2. **Spelling validation**: Case-insensitive comparison of user spelling vs correct spelling
3. **Elimination**: On incorrect spelling in a round, participant is marked as eliminated for that round only (can re-join if host adds them to next round)
4. **Round completion**: When all remaining active participants have spelled or been skipped
5. **Gamekey generation**: Random cryptographically secure string, generated when bee starts, cleaned up when bee ends
6. **Participant additions**: Can happen at the start of each round, not mid-round (except by explicit host action with modal)
7. **Game end**: When all rounds complete OR only 1 participant remains active

---

## DEPLOYMENT & ENVIRONMENT

- Frontend: Vercel, AWS S3 + CloudFront, or local dev server
- Backend: AWS ECS, Railway, DigitalOcean, or local dev server
- Database: PostgreSQL (local, RDS, or managed service)
- Real-time: Socket.io (runs on backend)

**Environment Variables:**
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (for signing host tokens)
- `NODE_ENV` (development | production)
- `PORT` (backend port, default 5000)
- `FRONTEND_URL` (for CORS, Socket.io origin)

---

## IMPLEMENTATION PHASES

1. **Phase 1 - Backend Foundation**: Database schema + migrations, JWT auth, REST API endpoints
2. **Phase 2 - WebSocket & Game Logic**: Socket.io setup, game state machine, round/elimination logic
3. **Phase 3 - Host Panel UI**: Auth pages, bee creation, control panel, participant management
4. **Phase 4 - Display Client UI**: Gamekey join, real-time display, verdict/results screens
5. **Phase 5 - Integration & Testing**: End-to-end testing, edge cases, deployment

---

## CRITICAL POINTS FOR CODE GENERATION

1. **Host interface must be protected by JWT** - only authenticated users can create/control bees
2. **Display client is public but gamekey-protected** - display can only connect if gamekey is valid (check backend)
3. **Real-time sync is one-way**: Host sends updates to display via Socket.io, display is read-only
4. **Spelling comparison should be case-insensitive** and allow for minor punctuation differences
5. **Gamekey should be unique and hard to guess** - use cryptographically secure random generation
6. **Participants can be added multiple times** across rounds, so track which round they're in
7. **Display should handle disconnections gracefully** with UI feedback and auto-reconnect
8. **Word pool should support multiple formats**: paste-separated list, file upload, or manual entry
9. **Bee creation is decoupled from round/word setup** - the host creates the bee (title only) first, then adds rounds and each round's word list afterward via separate calls; don't require word lists at bee-creation time

---

## WHAT COMES NEXT

After this context is loaded, you'll run focused prompts like:
- "Generate backend API + WebSocket setup"
- "Generate host control panel UI"
- "Generate display client UI"
- "Generate database schema + migrations"

Each prompt assumes this full context is understood.