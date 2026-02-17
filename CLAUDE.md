# CLAUDE.md

## What This Is

CLI agent template built with Bun + TypeScript. Provides an interactive chat interface powered by OpenAI's agent framework with Arcade.dev toolkit integration. Designed as a starting point for engineers building AI agents with external tool execution.

## Commands

| Command                                        | Purpose                                |
| ---------------------------------------------- | -------------------------------------- |
| `bun install`                                  | Install dependencies                   |
| `bun test`                                     | Run tests (mocked, no API keys needed) |
| `bun lint`                                     | Check formatting (Prettier)            |
| `bun format`                                   | Fix formatting                         |
| `bun build agent.ts --compile --outfile agent` | Compile to standalone binary           |
| `./agent.ts chat [message]`                    | Run the agent                          |

## Project Structure

- `agent.ts` — CLI entry point (Commander.js). Single `chat` command with `-t, --toolkits` option
- `classes/wrappedAgent.ts` — Abstract base agent with streaming, conversation history, interactive REPL
- `classes/config.ts` — Loads required env vars: `OPENAI_API_KEY`, `OPENAI_MODEL`, `LOG_LEVEL`, `ARCADE_API_KEY`, `USER_ID`
- `classes/logger.ts` — Logging with levels, colors (chalk), spinners (ora), tool call tracking
- `agents/general.ts` — Main agent implementation extending WrappedAgent
- `utils/tools.ts` — Arcade.dev toolkit → OpenAI agent tool conversion
- `utils/client.ts` — OpenAI client initialization
- `tests/` — Tests for CLI parsing, config loading, and logger

## Environment

- Runtime: Bun (v1.2.9+)
- TypeScript with ESNext target, bundler module resolution
- See `.env.example` for required environment variables

## CI

GitHub Actions runs three jobs: compile, lint, test. All must pass.

Run `bun format` before committing to avoid lint failures.
