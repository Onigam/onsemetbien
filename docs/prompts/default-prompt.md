# Default Prompt - Next Issue Implementation

Copy and paste this prompt to start working on the next GitHub issue:

---

Please help me implement the next issue in this project:

1. **Read the project context**: Check `CLAUDE.md` and `docs/architecture.md` to understand the project
2. **Read the project agents**: Check `.claude/agents/` to understand the agent list
3. **Find the next GitHub issue**: Look at the open issues in this repository and identify the next one to work on based on milestone priority (lowest milestone first, then by priority label, then by the issue number). Use gh command.
4. **Execute the agent chain**: Based on the issue requirements, automatically invoke and execute the appropriate specialized agents using @agent-organizer. Do NOT wait for my approval between agents - chain or parallelize them automatically.

## Agent Chaining / Parallelizing Rules

- **Execute agents**: Complete each agent's task before moving to the next or aggregate the parallel executions
- **Chain automatically**: Do not pause for user confirmation between sequences
- **Use specialized agents for finalization**:
  - @architect-reviewer: Validates architecture and TypeScript patterns
  - Code review before committing
- **Report progress**: Briefly indicate which agent is being invoked and what it's doing

## Expected Flow

```
Issue Analysis with @agent-organizer → Agents execute → ... → Review → PR Created
```

## Example Agent Chains (Sequential)

| Issue Type | Agent Chain |
|------------|-------------|
| Frontend | @agent-organizer → @ui-designer → @frontend-developer → review → commit |
| Backend | @agent-organizer → @backend-developer → review → commit |
| Full-Stack | @agent-organizer → @architect-reviewer → [@frontend-developer ∥ @backend-developer] → review → commit |
| Infrastructure | @agent-organizer → @devops-engineer → @deployment-engineer → review → commit |
| Bug Fix | @agent-organizer → @frontend-developer or @backend-developer → review → commit |

## Example Parallelized Flows

When tasks are independent and don't depend on each other's output, run agents in parallel:

| Issue Type | Parallel Flow |
|------------|---------------|
| Full-Stack Feature | @agent-organizer → [@frontend-developer ∥ @backend-developer] → review → commit |
| Multi-Service Update | @agent-organizer → [@devops-engineer ∥ @deployment-engineer] → review → commit |
| Complex Feature | @agent-organizer → @architect-reviewer → [@frontend-developer ∥ @backend-developer ∥ @devops-engineer] → review → commit |

**Legend**: `[A ∥ B]` means A and B run in parallel

### When to Parallelize

- **DO parallelize**: Independent components (frontend + backend), separate services, non-blocking research tasks
- **DON'T parallelize**: When one agent's output is another's input (e.g., types must be defined before implementation)

The final output should be a commit or PR URL ready for review.
