import { MCPServerStreamableHttp, getLogger } from "@openai/agents";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientMetadata,
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { Config } from "../classes/config";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ARCADE_DIR = join(import.meta.dir, "..", ".context", "arcade");
const TOKENS_FILE = join(ARCADE_DIR, "tokens.json");
const CLIENT_FILE = join(ARCADE_DIR, "client.json");
const VERIFIER_FILE = join(ARCADE_DIR, "verifier.txt");

function ensureDir() {
  if (!existsSync(ARCADE_DIR)) {
    mkdirSync(ARCADE_DIR, { recursive: true });
  }
}

function readJson<T>(path: string): T | undefined {
  try {
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf-8"));
  } catch {}
  return undefined;
}

function writeJson(path: string, data: unknown) {
  ensureDir();
  writeFileSync(path, JSON.stringify(data, null, 2));
}

class ArcadeOAuthProvider implements OAuthClientProvider {
  private _authCodePromise: Promise<string> | null = null;
  private _resolveAuthCode: ((code: string) => void) | null = null;

  get redirectUrl() {
    return "http://localhost:9876/callback";
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      redirect_uris: [this.redirectUrl],
      client_name: "arcade-cli-agent",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }

  clientInformation(): OAuthClientInformationFull | undefined {
    return readJson<OAuthClientInformationFull>(CLIENT_FILE);
  }

  saveClientInformation(info: OAuthClientInformationFull): void {
    writeJson(CLIENT_FILE, info);
  }

  tokens(): OAuthTokens | undefined {
    return readJson<OAuthTokens>(TOKENS_FILE);
  }

  saveTokens(tokens: OAuthTokens): void {
    writeJson(TOKENS_FILE, tokens);
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    const url = authorizationUrl.toString();
    console.log(`\nOpening browser for authentication...\n  ${url}\n`);
    const cmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    Bun.spawn([cmd, url]);

    // Set up a promise that will resolve with the auth code from the callback
    this._authCodePromise = new Promise<string>((resolve) => {
      this._resolveAuthCode = resolve;
    });

    // Start a temporary HTTP server to capture the callback
    const server = Bun.serve({
      port: 9876,
      fetch: (req) => {
        const reqUrl = new URL(req.url);
        if (reqUrl.pathname === "/callback") {
          const code = reqUrl.searchParams.get("code");
          if (code && this._resolveAuthCode) {
            this._resolveAuthCode(code);
          }
          server.stop();
          return new Response(
            "<html><body><h2>Authentication successful!</h2><p>You can close this tab.</p></body></html>",
            { headers: { "Content-Type": "text/html" } },
          );
        }
        return new Response("Not found", { status: 404 });
      },
    });
  }

  /** Wait for the OAuth callback and return the authorization code. */
  waitForAuthCode(): Promise<string> {
    if (!this._authCodePromise) {
      throw new Error("No auth flow in progress");
    }
    return this._authCodePromise;
  }

  saveCodeVerifier(verifier: string): void {
    ensureDir();
    writeFileSync(VERIFIER_FILE, verifier);
  }

  codeVerifier(): string {
    return readFileSync(VERIFIER_FILE, "utf-8");
  }
}

// A logger that suppresses errors (used during the expected OAuth redirect flow)
const quietLogger = {
  ...getLogger("arcade-mcp"),
  error: () => {},
};

export function createMcpServer(config: Config): MCPServerStreamableHttp {
  const provider = new ArcadeOAuthProvider();
  const serverOptions = {
    url: config.arcade_gateway_url,
    name: "arcade",
    authProvider: provider,
    clientSessionTimeoutSeconds: 60,
    timeout: 60_000,
  };

  // Use a quiet logger for the initial connect attempt — the SDK logs the
  // expected UnauthorizedError as "Error initializing MCP server:" before
  // re-throwing, which we handle below.
  const server = new MCPServerStreamableHttp({
    ...serverOptions,
    logger: quietLogger,
  });

  const originalConnect = server.connect.bind(server);
  server.connect = async () => {
    try {
      await originalConnect();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        console.log("Waiting for browser authentication...");
        const code = await provider.waitForAuthCode();

        await auth(provider, {
          serverUrl: config.arcade_gateway_url!,
          authorizationCode: code,
        });

        // Retry — tokens are now saved, so auth will succeed
        await originalConnect();
      } else {
        throw err;
      }
    }
  };

  return server;
}
