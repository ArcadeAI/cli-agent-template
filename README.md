# Arcade CLI Agent Template

## Prerequisites

- Bun installed on your computer - https://bun.com/docs/installation
- An OpenAI API Key - https://openai.com/
- An Arcade.dev API key - https://www.arcade.dev/

## This Repo

To install dependencies:

```bash
bun install
```

Then, set up the environment variables you will need:

```bash
cp .env.example .env
# fill it out with your information!
```

To run:

```bash
./agent.ts
```

To Compile as a single-file executable

```bash
bun build ./agent.ts --compile --outfile agent
```

Now you can run the program with `./agent` (no `.ts`) directly.

This project was created using `bun init` in bun v1.2.9. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Notes

- **Why Bun and TS?**: This is a template project for engineers. JS is the most popular programming language, and type-safety is helpful in IDEs when learning. Bun is a bit of a wildcard, because it's new and less popular than node.js, but it solves all of the TS/compiler problems... which I think will make it easier for folks to get started on the demo. Bun also makes it really easy to package and distribute binaries of applications.

## Testing

```bash
bun test
```

Testing Notes:

- We mock all OpenAI API calls, so an API Key is not needed.
