import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const rl = createInterface({ input, output });

async function main() {
  console.log("CoParent database setup");
  const url = (await rl.question("Paste your Neon DATABASE_URL: ")).trim();
  if (!url) throw new Error("DATABASE_URL is required");

  const appUrl = (await rl.question("App URL (press Enter for http://localhost:3000): ")).trim() || "http://localhost:3000";

  const secret = randomBytes(32).toString("hex");
  const content = `DATABASE_URL=${url}\nNEXT_PUBLIC_APP_URL=${appUrl}\nBETTER_AUTH_URL=${appUrl}\nBETTER_AUTH_SECRET=${secret}\nDEFAULT_TIME_ZONE=Europe/Helsinki\n`;
  writeFileSync(".env.local", content, { flag: "w" });
  console.log("Created .env.local");

  if (existsSync(".env.local")) {
    const result = spawnSync("npm", ["run", "db:migrate"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, DATABASE_URL: url },
    });
    if (result.status !== 0) throw new Error("Migration failed");
    console.log("Migrations applied. You can now run: npm run dev");
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
}).finally(() => rl.close());
