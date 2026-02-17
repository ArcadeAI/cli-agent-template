# CLI Agent Template

A template for building interactive CLI chat agents using [OpenAI's Agents SDK](https://openai.github.io/openai-agents-js/) and [Arcade MCP Gateways](https://docs.arcade.dev/en/guides/mcp-gateways). Built with Bun and TypeScript.

## Prerequisites

- [Bun](https://bun.com/docs/installation) installed on your computer
- An [OpenAI API Key](https://openai.com/)
- An [Arcade MCP Gateway URL](https://docs.arcade.dev/en/guides/mcp-gateways)

## Getting Started

Install dependencies:

```bash
bun install
```

Set up your environment variables:

```bash
cp .env.example .env
# fill it out with your information!
```

The `.env` file requires:

- `OPENAI_API_KEY` — Your OpenAI API key
- `OPENAI_MODEL` — The model to use (e.g. `gpt-5.2`)
- `LOG_LEVEL` — Logging verbosity (`info`, `debug`, etc.)
- `ARCADE_GATEWAY_URL` — Your Arcade MCP Gateway URL

## Usage

Start an interactive chat session:

```bash
./agent.ts chat
```

Start a chat with an initial message:

```bash
./agent.ts chat "What can you help me with?"
```

Override the gateway URL via CLI flag:

```bash
./agent.ts chat --gateway-url https://api.arcade.dev/mcp/your-gateway-slug
```

### In-Chat Commands

- `clear` — Clear conversation history and start fresh
- `quit` / `exit` — End the session

## Compiling

Build a single-file executable:

```bash
bun build ./agent.ts --compile --outfile agent
```

Then run it directly with `./agent`.

## Project Structure

```
agent.ts              — CLI entrypoint (Commander-based)
agents/general.ts     — General-purpose chat agent
classes/config.ts     — Environment variable configuration
classes/logger.ts     — Logging with timestamps and spinners
classes/wrappedAgent.ts — Base agent class (history, streaming, interactive chat)
utils/client.ts       — OpenAI client setup
utils/tools.ts        — Arcade MCP server connection with OAuth
```

## How It Works

The agent connects to an Arcade MCP Gateway, which provides tools the LLM can call during conversation. On first use, it opens a browser for OAuth authentication and caches tokens locally. Conversations are streamed to the terminal in real time.

## Testing

```bash
bun test
```

All OpenAI API calls are mocked, so no API key is needed for tests.

## Notes

- **Why Bun + TypeScript?** JS is the most popular programming language, and type-safety helps when learning. Bun eliminates TS compilation headaches and makes it easy to package and distribute binaries.
