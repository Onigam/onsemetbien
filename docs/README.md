# On se met bien - Documentation

Welcome to the On se met bien documentation! This directory contains comprehensive technical documentation for building and maintaining the web radio platform.

---

## Documentation Structure

### Core Documentation

- **[Architecture](./architecture.md)** - System design, data flows, and infrastructure
- **[CLAUDE.md](../CLAUDE.md)** - Instructions for AI agents working on the project (root level)

### Prompts

#### [Prompts](./prompts/)
Multi-agent orchestration and implementation strategies:
- **[README](./prompts/README.md)** - Prompt overview and usage instructions
- **[Multi-Agent Implementation](./prompts/multi-agent-implementation.md)** - Master orchestration prompt for TypeScript refactor
- **[Default Prompt](./prompts/default-prompt.md)** - Default prompt for working on the next GitHub issue

### Other Documentation (Root Level)

- **[README](../README.md)** - Project overview and quick start
- **[CONTRIBUTING-ADDING-TRACKS](../CONTRIBUTING-ADDING-TRACKS.md)** - Track contribution guide
- **[DOCKER](../DOCKER.md)** - Docker setup guide

---

## For AI Agents

If you're an AI agent tasked with implementing or maintaining On se met bien, start here:

1. **Read [CLAUDE.md](../CLAUDE.md)** to understand the project, tech stack, and constraints
2. **Study [Architecture](./architecture.md)** to understand how components connect
3. **Review [Multi-Agent Implementation](./prompts/multi-agent-implementation.md)** for the TypeScript refactor plan

### Key Principles for AI Agents

- **Preserve the design**: The neobrutalist aesthetic (thick borders, cyan/purple/orange palette) must be kept pixel-perfect during refactoring
- **Type Safety**: All new code must be TypeScript with strict mode
- **Real-time first**: Socket.IO events are the backbone - never break the real-time sync
- **Simple over clever**: This is a fun radio app, keep it straightforward
- **Test the audio flow**: Always verify track playback, skip voting, and listener sync work end-to-end

---

## Project Structure

```
onsemetbien/
├── docs/                          # This directory
│   ├── README.md                  # This file
│   ├── architecture.md            # System architecture
│   └── prompts/                   # Multi-agent prompts
│       ├── README.md              # Prompt index
│       ├── multi-agent-implementation.md  # TypeScript refactor prompt
│       └── default-prompt.md      # Default issue workflow prompt
│
├── .claude/
│   └── agents/                    # AI agent definitions (14 agents)
│
├── public/                        # Current frontend (to be refactored)
│   └── index.html                 # Monolithic player interface
│
├── src/                           # Server source code
│   ├── server.ts                  # Express + Socket.IO server
│   ├── config/                    # Database configuration
│   ├── models/                    # Mongoose models
│   ├── types/                     # TypeScript type definitions
│   ├── common/                    # Shared constants
│   ├── services/                  # Business logic
│   └── scripts/                   # Utility scripts
│
├── apps/
│   ├── webradio/                  # Web radio package
│   └── backoffice/                # Management interface
│
├── shared/                        # Shared types & models
├── tools/                         # CLI utilities
└── tracks-proposals/              # Track contributions
```

---

**Last Updated**: 2026-02-08
**Maintained By**: Development Team + AI Agents
