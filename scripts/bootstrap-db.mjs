import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const envFile = join(rootDir, ".env");

function loadEnvFile() {
  if (!existsSync(envFile)) {
    return;
  }

  const content = readFileSync(envFile, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolvePsqlCommand() {
  if (process.env.PSQL_PATH) {
    return process.env.PSQL_PATH;
  }

  if (process.platform === "win32") {
    const versions = [18, 17, 16, 15, 14, 13, 12];
    for (const version of versions) {
      const candidate = `C:\\Program Files\\PostgreSQL\\${version}\\bin\\psql.exe`;
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return "psql";
}

function canUseLocalPsql(psqlCommand) {
  if (psqlCommand !== "psql") {
    return existsSync(psqlCommand);
  }

  const result = spawnSync(psqlCommand, ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}

function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

function runSqlFileWithLocalPsql(psqlCommand, databaseUrl, filePath) {
  const { host, port, user, password, database } = parseDatabaseUrl(databaseUrl);
  const result = spawnSync(
    psqlCommand,
    [
      "-v",
      "ON_ERROR_STOP=1",
      "-h",
      host,
      "-p",
      port,
      "-U",
      user,
      "-d",
      database,
      "-f",
      filePath,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PGPASSWORD: password,
        PGCLIENTENCODING: process.env.PGCLIENTENCODING || "UTF8",
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runSqlFileWithDocker(databaseUrl, filePath) {
  const { user, password, database } = parseDatabaseUrl(databaseUrl);
  const serviceName = process.env.DOCKER_DB_SERVICE || "postgres";
  const sqlContent = readFileSync(filePath, "utf8");

  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      serviceName,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      user,
      "-d",
      database,
    ],
    {
      input: sqlContent,
      stdio: ["pipe", "inherit", "inherit"],
      env: {
        ...process.env,
        PGPASSWORD: password,
        PGCLIENTENCODING: process.env.PGCLIENTENCODING || "UTF8",
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL não definida nem no ambiente nem no arquivo .env.");
  process.exit(1);
}

const psqlCommand = resolvePsqlCommand();
const defaultSqlFiles = [
  "ModelagemBanco/condoreserva_database.sql",
  "db/migrations/001_seed_usuarios_iniciais.sql",
  "db/migrations/002_auth_recuperacao_senha.sql",
  "db/migrations/003_reservas_aprovacao_notificacoes.sql",
];
const cliFiles = process.argv.slice(2);
const sqlFiles = cliFiles.length > 0 ? cliFiles : defaultSqlFiles;
const bootstrapMode = process.env.DB_BOOTSTRAP_MODE || "auto";
const useLocalPsql =
  bootstrapMode === "local" ||
  (bootstrapMode === "auto" && canUseLocalPsql(psqlCommand));

for (const file of sqlFiles) {
  const absolutePath = join(rootDir, file);

  if (!existsSync(absolutePath)) {
    console.error(`Arquivo SQL não encontrado: ${file}`);
    process.exit(1);
  }

  console.log(`\n>> Aplicando ${file}`);
  if (useLocalPsql) {
    runSqlFileWithLocalPsql(psqlCommand, databaseUrl, absolutePath);
  } else {
    runSqlFileWithDocker(databaseUrl, absolutePath);
  }
}

console.log("\nBootstrap concluído com sucesso.");
