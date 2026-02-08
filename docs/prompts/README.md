# Multi-Agent Orchestration Prompts

This directory contains prompts designed for coordinating multi-agent AI systems to implement and maintain the On se met bien project.

## Contents

### [`multi-agent-implementation.md`](./multi-agent-implementation.md)
**Purpose**: Master orchestration prompt for refactoring the frontend from a monolithic `index.html` into a TypeScript application while preserving the exact neobrutalist design.

**What it does**:
- Coordinates specialized AI agents to refactor the frontend
- Preserves pixel-perfect neobrutalist design throughout the process
- Implements proper TypeScript component architecture
- Delivers production-ready code via pull request

**Team Structure**:
1. **Multi-Agent Coordinator** - Overall orchestration
2. **Project Manager** - Task distribution & tracking
3. **Context Manager** - State management
4. **Architect Reviewer** - Quality control & architecture validation
5. **TypeScript Pro** - TypeScript setup & type safety
6. **Frontend Developer** - Component implementation
7. **UI Designer** - Design preservation & CSS architecture
8. **Backend Developer** - Server-side adjustments if needed
9. **DevOps Engineer** - Build tooling & deployment

### [`default-prompt.md`](./default-prompt.md)
**Purpose**: Default workflow prompt for implementing the next GitHub issue using agent chaining.

**What it does**:
- Reads available agents from `.claude/agents/`
- Finds the next GitHub issue by priority
- Automatically chains or parallelizes the right agents
- Ends with code review and PR creation

---

## How to Use These Prompts

### Prerequisites

Before using the multi-agent implementation prompt:

1. All documentation is complete (`/docs/`)
2. Agent definitions exist (`/.claude/agents/`)
3. Current codebase is on a clean git state
4. Development environment works (`pnpm dev:radio`)

### Usage Instructions

1. **Copy the prompt**: Open the relevant `.md` file and copy the entire content

2. **Start a new conversation**: Launch a new Claude Code session

3. **Paste the prompt**: Paste the prompt as the first message

4. **Monitor progress**: The multi-agent coordinator will:
   - Launch specialized agents
   - Provide status updates
   - Report blockers
   - Coordinate handoffs between agents

5. **Review deliverables**: After completion:
   - Review the feature branch
   - Check the pull request
   - Test the implementation locally
   - Verify the neobrutalist design is preserved

### Execution Phases (TypeScript Refactor)

Agents will execute in sequential phases with parallel work where possible:

1. **Analysis** - Audit current `index.html`, extract design tokens and components
2. **Foundation** - Set up TypeScript, bundler, project structure
3. **CSS Architecture** - Extract and organize CSS into modules
4. **Components** - Build TypeScript components (parallel: Header, Equalizer, SkipVote, etc.)
5. **Services** - Socket.IO client wrapper, audio playback manager
6. **Integration** - Wire everything together, ensure real-time sync works
7. **Testing** - Visual regression, functional testing
8. **PR** - Create feature branch and pull request

**Execution Mode**: Multi-agent parallel implementation with automatic dependency management

---

## Quality Standards

All implementations must meet:

- The frontend must look **exactly** the same as the current `index.html`
- TypeScript strict mode (no `any` types)
- Socket.IO events must remain backward-compatible
- Audio playback and skip voting must work identically
- Neobrutalist design preserved (thick borders, cyan/purple/orange palette, custom audio player)
- Real-time listener sync must not break

---

## Agent Chaining Examples

### Frontend Refactor
```
@agent-organizer → @architect-reviewer → [@frontend-developer || @ui-designer] → @typescript-pro → @code-reviewer → @git-workflow-manager
```

### Bug Fix
```
@agent-organizer → @frontend-developer or @backend-developer → @code-reviewer → @git-workflow-manager
```

### New Feature (Full-Stack)
```
@agent-organizer → [@frontend-developer || @backend-developer] → @code-reviewer → @git-workflow-manager
```

### Infrastructure Change
```
@agent-organizer → @devops-engineer → @deployment-engineer → @code-reviewer → @git-workflow-manager
```

**Legend**: `||` means agents run in parallel

### When to Parallelize

- **DO parallelize**: Independent components (e.g., Header + Equalizer), separate services, non-blocking research
- **DON'T parallelize**: When one agent's output is another's input (e.g., CSS must be extracted before components can use it)

---

## Support

For questions or issues:
- Review the full documentation in `/docs/`
- Check architecture in `/docs/architecture.md`
- Consult agent definitions in `/.claude/agents/`

---

**Last Updated**: 2026-02-08
