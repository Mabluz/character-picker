"use strict";
const { Pool } = require("pg");
const fs = require("fs-extra");
const path = require("path");

let pool;

const init = async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });

  console.log("PostgreSQL pool created");

  await runMigrations();
  await autoLoadGames();

  console.log("Database initialization complete");
};

const getPool = () => pool;

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get list of executed migrations
    const result = await client.query("SELECT name FROM migrations");
    const executedMigrations = new Set(result.rows.map((row) => row.name));

    // Get all migration files
    const migrationsDir = path.join(__dirname, "..", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // Run pending migrations
    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        console.log(`Migration executed: ${file}`);
      }
    }
  } finally {
    client.release();
  }
};

const autoLoadGames = async () => {
  const gamesDir = process.env.GAMES_DIR || path.join(__dirname, "..", "games");
  if (!fs.existsSync(gamesDir)) {
    console.log("No games directory found at", gamesDir);
    return;
  }

  const folders = fs.readdirSync(gamesDir).filter((f) => {
    const folderPath = path.join(gamesDir, f);
    return fs.statSync(folderPath).isDirectory();
  });

  const client = await pool.connect();
  try {
    for (const folder of folders) {
      const loadJsonPath = path.join(gamesDir, folder, "load.json");
      if (!fs.existsSync(loadJsonPath)) {
        continue;
      }

      // Load game from file and upsert (insert or update)
      const gameData = JSON.parse(fs.readFileSync(loadJsonPath, "utf-8"));
      const title = gameData.background?.title || folder.replace(/-/g, " ");

      await client.query(
        `INSERT INTO main_games (id, title, characters, tabs, background, settings)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = $2,
           characters = $3,
           tabs = $4,
           background = $5,
           settings = $6,
           updated_at = NOW()`,
        [
          folder,
          title,
          JSON.stringify(gameData.characters || []),
          gameData.tabs ? JSON.stringify(gameData.tabs) : null,
          JSON.stringify(gameData.background || {}),
          JSON.stringify(gameData.settings || {})
        ]
      );
      console.log(`Game loaded: ${folder}`);
    }
  } finally {
    client.release();
  }
};

const query = async (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  init,
  getPool,
  query
};
