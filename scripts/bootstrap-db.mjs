import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

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

function shouldUseSsl(databaseUrl) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode === "disable") {
    return false;
  }

  if (sslMode === "require" || sslMode === "verify-full" || sslMode === "verify-ca") {
    return true;
  }

  return !["localhost", "127.0.0.1"].includes(url.hostname);
}

function getConnectionStringWithoutSslMode(databaseUrl) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("sslmode");
  return url.toString();
}

async function runSqlFilesWithDatabaseUrl(databaseUrl, sqlFiles) {
  const client = new pg.Client({
    connectionString: getConnectionStringWithoutSslMode(databaseUrl),
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    for (const file of sqlFiles) {
      const absolutePath = join(rootDir, file);

      if (!existsSync(absolutePath)) {
        console.error(`Arquivo SQL não encontrado: ${file}`);
        process.exit(1);
      }

      console.log(`\n>> Aplicando ${file}`);
      const sqlContent = readFileSync(absolutePath, "utf8");
      await client.query(sqlContent);
    }
  } finally {
    await client.end();
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL não definida nem no ambiente nem no arquivo .env.");
  process.exit(1);
}

const defaultSqlFiles = [
  "ModelagemBanco/condoreserva_database.sql",
  "db/migrations/001_seed_usuarios_iniciais.sql",
  "db/migrations/002_auth_recuperacao_senha.sql",
  "db/migrations/003_reservas_aprovacao_notificacoes.sql",
];
const cliFiles = process.argv.slice(2);
const sqlFiles = cliFiles.length > 0 ? cliFiles : defaultSqlFiles;

runSqlFilesWithDatabaseUrl(databaseUrl, sqlFiles)
  .then(() => {
    console.log("\nBootstrap concluído com sucesso.");
  })
  .catch((error) => {
    console.error("\nErro ao aplicar SQL:", error.message);
    process.exit(1);
  });
