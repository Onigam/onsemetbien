# On se met bien - Multi-Agent Frontend TypeScript Refactor

## Mission Statement

Refactor the On se met bien web radio frontend from a monolithic `public/index.html` into a proper TypeScript application, preserving the **exact** Windows 95 neobrutalist design pixel-for-pixel. Deliver a production-ready codebase via pull request.

## Project Context

**Repository**: onsemetbien (pnpm monorepo)
**Current State**: Working web radio with monolithic HTML/CSS/JS frontend
**Goal**: Refactor frontend into TypeScript components with proper architecture
**Critical Constraint**: The UI must look IDENTICAL to the current version
**Execution**: Multi-agent parallel implementation with sequential phase dependencies
**Deliverable**: Pull request with complete refactored frontend

## What Exists

- Working Express.js + Socket.IO server (`src/server.ts`)
- Monolithic frontend (`public/index.html` - ~360 lines)
  - Inline CSS (~235 lines) with Win95 design tokens
  - Inline JavaScript (~85 lines) with Socket.IO client
- MongoDB track database with Mongoose models
- OVH S3 audio storage with presigned URLs
- pnpm monorepo structure with apps/, shared/, tools/
- Specialized AI agent definitions (`/.claude/agents/`)
- Complete documentation (`/docs/`)

## What Needs to Be Done

Refactor the frontend **only** - the server stays as-is:

- Extract CSS into organized modules (variables, base, components)
- Convert JavaScript to TypeScript with proper types
- Split UI into discrete components
- Add a build step (Vite or similar)
- Wire up Socket.IO with typed events
- Ensure identical visual output
- No new features - pure refactor

## Scope: Frontend Refactor ONLY

**In Scope** (Implement Now):
- Extract CSS custom properties into `variables.css`
- Extract Win95 base styles into `win95.css`
- Extract component styles into separate files
- Create TypeScript component files (Header, PlayerInfo, Equalizer, AudioPlayer, SkipVote, ListenerCount)
- Create typed Socket.IO client service
- Create audio playback manager service
- Define TypeScript interfaces for Socket.IO events
- Set up Vite (or similar) for bundling
- Configure TypeScript for the frontend package
- Minimal HTML shell (`index.html`) that loads the bundle
- Verify visual parity with screenshots

**Out of Scope** (Do NOT implement):
- Server-side changes (keep `src/server.ts` as-is)
- New features or UI changes
- Framework adoption (React, Vue, etc.) - use vanilla TypeScript
- Design changes of any kind
- Backoffice changes
- Database or storage changes

## Required Documentation References

All agents MUST read and follow these documents:

1. **CLAUDE.md** (root) - Project overview, constraints, patterns
2. **Architecture** (`/docs/architecture.md`) - System design, data flows, CSS design tokens
3. **Current Frontend** (`/public/index.html`) - THE source of truth for design

## Team Structure & Roles

### 1. Multi-Agent Coordinator (Primary Orchestrator)
**Agent**: `multi-agent-coordinator`
**Responsibilities**:
- Oversee entire refactoring process
- Launch and coordinate all specialized agents
- Manage handoffs between phases
- Resolve conflicts and blockers
- Final integration verification

### 2. Project Manager
**Agent**: `project-manager`
**Responsibilities**:
- Break down refactor into granular tasks
- Assign tasks to implementation agents
- Track progress against phases
- Identify dependencies and critical path

### 3. Context Manager
**Agent**: `context-manager`
**Responsibilities**:
- Maintain shared state across agents
- Store extracted CSS tokens, component specs
- Track file changes and modifications
- Ensure consistency across components

### 4. Architect Reviewer
**Agent**: `architect-reviewer`
**Responsibilities**:
- Review component architecture decisions
- Ensure TypeScript patterns are consistent
- Validate build configuration
- Approve component boundaries and interfaces

### 5. Implementation Agents

**TypeScript Pro** (`typescript-pro`)
- Configure TypeScript for frontend package
- Set up Vite bundler
- Define shared types (Socket events, Track, etc.)
- Ensure strict type safety

**Frontend Developer** (`frontend-developer`)
- Implement TypeScript components
- Wire up Socket.IO typed client
- Implement audio playback manager
- Ensure functional parity with current JS

**UI Designer** (`ui-designer`)
- Extract and organize CSS architecture
- Verify visual parity (pixel-perfect)
- Ensure Win95 design tokens are preserved
- Validate responsive behavior

**Backend Developer** (`backend-developer`)
- Adjust `express.static` path if needed
- Verify Socket.IO compatibility
- Ensure presigned URLs work with new frontend

**DevOps Engineer** (`devops-engineer`)
- Configure Vite build pipeline
- Update Railway/Docker config if needed
- Ensure `pnpm dev:radio` still works
- Update build scripts in package.json

## Execution Strategy

### Phase 1: Analysis & Extraction
**Owner**: UI Designer + Context Manager
**Dependencies**: None

1. **Audit `public/index.html`**:
   - Catalog all CSS custom properties
   - List all HTML elements and their styling
   - Document all JavaScript behaviors
   - Take screenshots for visual reference

2. **Extract design tokens**:
   ```css
   /* variables.css */
   :root {
     --win95-grey: #c0c0c0;
     --win95-dark: #808080;
     --win95-darker: #404040;
     --win95-light: #ffffff;
     --win95-blue: #000080;
     --win95-text: #000000;
     --win95-orange: #ffa500;
   }
   ```

3. **Define component boundaries**:
   - Header (logo, title, tagline)
   - PlayerInfo (now-playing, listeners, skip-vote)
   - Equalizer (5 animated bars)
   - AudioPlayer (HTML5 audio with Win95 chrome)
   - SkipVote (button + vote count)
   - ListenerCount (listener display)

**Deliverables**:
- Design token catalog
- Component inventory with HTML/CSS/JS per component
- Screenshots for visual comparison

### Phase 2: Foundation
**Owner**: TypeScript Pro + DevOps Engineer
**Dependencies**: Phase 1 complete

1. **Set up frontend package structure**:
   ```
   apps/webradio/
   ├── src/
   │   ├── components/
   │   ├── services/
   │   ├── styles/
   │   ├── types/
   │   └── main.ts
   ├── index.html
   ├── package.json
   ├── tsconfig.json
   └── vite.config.ts
   ```

2. **Configure TypeScript** (strict mode):
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "moduleResolution": "bundler"
     }
   }
   ```

3. **Configure Vite**:
   - TypeScript support
   - Dev server with proxy to Express backend
   - Production build to `dist/`

4. **Define TypeScript types**:
   ```typescript
   // types/events.ts
   interface TrackChangeEvent {
     title: string;
     url: string;
     type: TrackType;
     startTime: number;
     currentPosition?: number;
     skipVotes: number;
   }

   interface SkipVotesUpdateEvent {
     votes: number;
     required: number;
   }

   type ServerToClientEvents = {
     trackChange: (track: TrackChangeEvent) => void;
     listenersUpdate: (count: number) => void;
     skipVotesUpdate: (data: SkipVotesUpdateEvent) => void;
   };

   type ClientToServerEvents = {
     voteSkip: () => void;
   };
   ```

**Deliverables**:
- Frontend package initialized
- TypeScript + Vite configured
- Types defined
- Dev server working (empty page)

### Phase 3: CSS Architecture
**Owner**: UI Designer
**Dependencies**: Phase 2 complete

1. **Extract CSS into modules**:
   - `styles/variables.css` - Custom properties
   - `styles/win95.css` - Base Win95 styles (beveled borders, buttons, title bars)
   - `styles/equalizer.css` - Equalizer animation
   - `styles/player.css` - Audio player styling
   - `styles/layout.css` - Body, header, overall layout

2. **Verify CSS parity**: Import all CSS in `main.ts` and confirm visual match

**Deliverables**:
- CSS modules created
- Visual parity confirmed

### Phase 4: Components
**Owner**: Frontend Developer + UI Designer (parallel)
**Dependencies**: Phase 3 complete

Build components in parallel (they are independent):

1. **Header** - Logo image, title, tagline
2. **PlayerInfo** - Container with now-playing display, listener count, skip vote
3. **Equalizer** - 5 bars with CSS animation toggle
4. **AudioPlayer** - `<audio>` element wrapper with play/pause state
5. **SkipVote** - Button + vote count display
6. **ListenerCount** - Listener count display

Each component:
- Creates its DOM elements
- Applies appropriate CSS classes
- Exposes an `update()` method for state changes
- Mounts to a container element

**Deliverables**:
- All components implemented in TypeScript
- Each component renders correctly in isolation

### Phase 5: Services
**Owner**: Frontend Developer
**Dependencies**: Phase 2 complete (can run in parallel with Phase 4)

1. **Socket.IO Service** (`services/socket.ts`):
   - Typed client with `ServerToClientEvents` and `ClientToServerEvents`
   - Event listeners with callbacks
   - Connection/disconnection handling
   - `emitVoteSkip()` method

2. **Audio Service** (`services/audio.ts`):
   - Wraps HTML5 Audio API
   - Play/pause/seek control
   - Playback state events (for equalizer sync)
   - Prevent seeking (maintain radio sync)
   - Handle autoplay restrictions

**Deliverables**:
- Typed Socket.IO client
- Audio playback manager
- Both services tested with real server

### Phase 6: Integration
**Owner**: Frontend Developer + Backend Developer
**Dependencies**: Phases 4 and 5 complete

1. **Wire `main.ts`**:
   - Import all CSS
   - Initialize Socket.IO service
   - Initialize Audio service
   - Create and mount all components
   - Connect Socket events to component updates
   - Handle user interaction (first click to enable autoplay)

2. **Update server** (if needed):
   - Adjust `express.static` to serve built frontend
   - Ensure Socket.IO path compatibility

3. **Update package.json scripts**:
   - `dev` script runs Vite dev server + Express
   - `build` script produces production bundle
   - `start` script serves built frontend

**Deliverables**:
- Fully working frontend (identical to current)
- Development workflow working
- Production build working

### Phase 7: Verification & Testing
**Owner**: All agents + Architect Reviewer
**Dependencies**: Phase 6 complete

1. **Visual verification**:
   - Compare screenshots side-by-side
   - Check all CSS animations (equalizer bounce)
   - Verify Win95 beveled effects
   - Test responsive behavior

2. **Functional verification**:
   - Track playback works
   - Track changes sync across clients
   - Skip voting works (threshold + reset)
   - Listener count updates
   - Audio autoplay after first interaction
   - Joining mid-track works (currentPosition sync)

3. **Type safety verification**:
   - `pnpm type-check` passes
   - No `any` types
   - All Socket events typed

**Deliverables**:
- All verifications passing
- No visual regressions

### Phase 8: PR Creation
**Owner**: Multi-Agent Coordinator
**Dependencies**: Phase 7 complete

1. Create feature branch: `feat/typescript-frontend-refactor`
2. Commit all changes with clear messages
3. Create PR with:
   - Summary of what changed
   - Before/after screenshots
   - Testing instructions
   - List of new files

**Deliverables**:
- Feature branch with complete refactor
- Pull request ready for review

## Agent Communication Protocol

### Status Updates
Each agent provides updates:
```markdown
**Agent**: [agent-name]
**Task**: [current task]
**Status**: [in_progress | completed | blocked]
**Progress**: [percentage]
**Blockers**: [list any blockers]
**Next**: [next task]
```

### Handoffs
When completing work for another agent:
```markdown
**From**: [agent-name]
**To**: [agent-name]
**Completed**: [what was delivered]
**Files**: [list of files created/modified]
**Notes**: [important context]
```

## Success Criteria

### Visual Requirements
- The refactored frontend looks **identical** to `public/index.html`
- All CSS animations work (equalizer bars)
- All Win95 beveled effects render correctly
- Logo, title, and tagline positioned correctly

### Functional Requirements
- Track playback works end-to-end
- Socket.IO real-time sync works
- Skip voting works with correct threshold
- Listener count updates on connect/disconnect
- Mid-track joining syncs correctly
- Autoplay works after user interaction

### Technical Requirements
- TypeScript strict mode, no errors
- Clean component architecture
- Typed Socket.IO events
- Vite build produces working bundle
- `pnpm dev:radio` works for development
- `pnpm build` produces production output

## Execution Command

Multi-Agent Coordinator, you are now authorized to:
1. Launch all specialized agents as needed
2. Distribute work according to this plan
3. Coordinate execution across all phases
4. Ensure the design is preserved pixel-perfect
5. Deliver final pull request

**BEGIN IMPLEMENTATION**
