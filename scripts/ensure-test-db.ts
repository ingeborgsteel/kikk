import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const __dirname = new URL(".", import.meta.url).pathname;
const WRANGLER_JSON = path.resolve(__dirname, "..", "wrangler.json");

interface D1Binding {
  binding: string;
  database_name?: string;
  database_id?: string;
  migrations_dir?: string;
}

interface WranglerEnvironment {
  name?: string;
  d1_databases?: D1Binding[];
}

interface WranglerConfig {
  env?: Record<string, WranglerEnvironment>;
}

interface ExecError {
  stdout?: string;
  stderr?: string;
  message?: string;
}

function readConfig(): WranglerConfig {
  const content = readFileSync(WRANGLER_JSON, "utf-8");
  return JSON.parse(content) as WranglerConfig;
}

function writeConfig(config: WranglerConfig): void {
  writeFileSync(WRANGLER_JSON, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

function getTestDbBinding(config: WranglerConfig): D1Binding {
  const testEnv = config.env?.test;
  if (!testEnv) {
    throw new Error("No env.test block found in wrangler.json");
  }
  const binding = testEnv.d1_databases?.find((db) => db.binding === "DB");
  if (!binding) {
    throw new Error("No D1 binding named 'DB' in env.test");
  }
  return binding;
}

function runWrangler(args: string): string {
  try {
    return execSync(`npx wrangler ${args}`, {
      cwd: path.dirname(WRANGLER_JSON),
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CI: "true" },
    });
  } catch (error) {
    const execError = error as ExecError;
    const output =
      `${execError.stdout ?? ""}\n${execError.stderr ?? ""}`.trim();
    throw new Error(
      `wrangler command failed: npx wrangler ${args}\n${output || execError.message}`,
    );
  }
}

function findDatabaseUuid(name: string): string {
  const output = runWrangler("d1 list --json");
  const databases = JSON.parse(output) as Array<{ name: string; uuid: string }>;
  const match = databases.find((db) => db.name === name);
  if (!match) {
    throw new Error(
      `D1 database "${name}" not found. Run 'npx wrangler d1 create ${name}'.`,
    );
  }
  return match.uuid;
}

function createOrFindDatabase(name: string): string {
  console.log(`Ensuring D1 database "${name}" exists...`);
  try {
    const output = runWrangler(`d1 create ${name}`);
    const match = output.match(/"database_id":\s*"([^"]+)"/);
    if (match) {
      console.log(`Created D1 database "${name}" with ID ${match[1]}`);
      return match[1];
    }
    console.log("Created database; resolving ID from list...");
    return findDatabaseUuid(name);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log(`Database "${name}" already exists; looking up ID...`);
      return findDatabaseUuid(name);
    }
    throw error;
  }
}

function main(): void {
  const config = readConfig();
  const binding = getTestDbBinding(config);

  if (binding.database_id && UUID_REGEX.test(binding.database_id)) {
    console.log(
      `env.test DB "${binding.database_name ?? "DB"}" already configured with ID ${binding.database_id}`,
    );
    return;
  }

  const dbName = binding.database_name ?? "kikk-db-test";
  const uuid = createOrFindDatabase(dbName);
  binding.database_id = uuid;
  writeConfig(config);
  console.log(`Updated wrangler.json env.test DB binding with ID ${uuid}`);
}

main();
