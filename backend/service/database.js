"use strict";
const { Pool } = require("pg");
const fs = require("fs-extra");
const path = require("path");

let pool;

const init = async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  pool.on("error", err => {
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
    const executedMigrations = new Set(result.rows.map(row => row.name));

    // Get all migration files
    const migrationsDir = path.join(__dirname, "..", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
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

  const folders = fs.readdirSync(gamesDir).filter(f => {
    const folderPath = path.join(gamesDir, f);
    return fs.statSync(folderPath).isDirectory();
  });

  // Only folders that actually have a load.json are valid games
  const validIds = new Set(
    folders.filter(f => fs.existsSync(path.join(gamesDir, f, "load.json")))
  );

  // Load git-based last-modified dates if available
  const lastmodPath = path.join(__dirname, "..", "lastmod.json");
  const lastmodDates = fs.existsSync(lastmodPath)
    ? JSON.parse(fs.readFileSync(lastmodPath, "utf-8"))
    : {};

  const client = await pool.connect();
  try {
    for (const folder of validIds) {
      const loadJsonPath = path.join(gamesDir, folder, "load.json");

      // Load game from file and upsert (insert or update)
      const gameData = JSON.parse(fs.readFileSync(loadJsonPath, "utf-8"));
      const title = gameData.background?.title || folder.replace(/-/g, " ");

      await client.query(
        `INSERT INTO main_games (id, title, characters, tabs, background, settings, affiliate, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = $2,
           characters = $3,
           tabs = $4,
           background = $5,
           settings = $6,
           affiliate = $7,
           updated_at = $8`,
        [
          folder,
          title,
          JSON.stringify(gameData.characters || []),
          gameData.tabs ? JSON.stringify(gameData.tabs) : null,
          JSON.stringify(gameData.background || {}),
          JSON.stringify(gameData.settings || {}),
          gameData.affiliate ? JSON.stringify(gameData.affiliate) : null,
          lastmodDates[folder] || new Date()
        ]
      );
      console.log(`Game loaded: ${folder}`);
    }

    // Remove any DB rows that no longer have a matching folder
    const dbResult = await client.query("SELECT id FROM main_games");
    for (const row of dbResult.rows) {
      if (!validIds.has(row.id)) {
        await client.query("DELETE FROM main_games WHERE id = $1", [row.id]);
        console.log(`Game removed (folder gone): ${row.id}`);
      }
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
