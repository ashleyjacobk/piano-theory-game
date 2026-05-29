const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.db");

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite Database:", dbPath);
    initializeDatabase();
  }
});

// Helper functions to wrap sqlite3 methods in Promises
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function dbQueryGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbQueryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Create tables and seed data if fresh
async function initializeDatabase() {
  try {
    // 1. Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        teacherCode TEXT,
        lessonDay TEXT DEFAULT 'Wednesday'
      )
    `);

    // 2. Create Homework Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS homework (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        type TEXT,
        target INTEGER,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        assignedAt TEXT,
        dueDate TEXT,
        songName TEXT
      )
    `);

    // 3. Create Practice Logs Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS practice_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        minutes INTEGER,
        date TEXT,
        notes TEXT,
        songName TEXT
      )
    `);

    // 4. Create Free Practice Stats Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS free_practice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        type TEXT,
        score INTEGER,
        date TEXT
      )
    `);

    // 5. Create Shared Videos Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        songName TEXT,
        title TEXT,
        url TEXT,
        studentUsername TEXT,
        composer TEXT
      )
    `);

    // Migration check: Add studentUsername if the table already existed without it
    try {
      await dbRun("ALTER TABLE videos ADD COLUMN studentUsername TEXT");
      console.log("Migration: Added studentUsername column to videos table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // Migration check: Add composer if the table already existed without it
    try {
      await dbRun("ALTER TABLE videos ADD COLUMN composer TEXT");
      console.log("Migration: Added composer column to videos table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // Migration check: Add dueDate if the table already existed without it
    try {
      await dbRun("ALTER TABLE homework ADD COLUMN dueDate TEXT");
      console.log("Migration: Added dueDate column to homework table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // Migration check: Add songName if the table already existed without it
    try {
      await dbRun("ALTER TABLE homework ADD COLUMN songName TEXT");
      console.log("Migration: Added songName column to homework table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // Migration check: Add lessonDay if the table already existed without it
    try {
      await dbRun("ALTER TABLE users ADD COLUMN lessonDay TEXT DEFAULT 'Wednesday'");
      console.log("Migration: Added lessonDay column to users table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // Migration check: Add songName column to practice_logs table if it doesn't exist
    try {
      await dbRun("ALTER TABLE practice_logs ADD COLUMN songName TEXT");
      console.log("Migration: Added songName column to practice_logs table.");
    } catch (err) {
      // Safe to ignore if column already exists
    }

    // 6. Create Archived Songs Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS archived_songs (
        songName TEXT PRIMARY KEY
      )
    `);

    // 7. Create Video Comments Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS video_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId INTEGER,
        username TEXT,
        name TEXT,
        text TEXT,
        createdAt TEXT,
        FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE
      )
    `);

    console.log("Database tables initialized successfully.");

    // Seed mock data if database is fresh
    const userCount = await dbQueryGet("SELECT COUNT(*) AS count FROM users");
    
    if (userCount.count === 0) {
      console.log("Fresh database detected. Pre-seeding default mock data...");

      // Seed Users
      await dbRun("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", ["teacher", "teacher@piano.com", "password", "Mr. Smith", "teacher", "SMITH101"]);
      await dbRun("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", ["ashley", "ashley@piano.com", "password", "Ashley", "student", "SMITH101"]);

      // Seed Homework
      await dbRun("INSERT INTO homework (username, type, target, progress, completed, assignedAt, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)", ["ashley", "note", 10, 3, 0, "2026-05-28", "2026-06-04"]);

      // Seed Practice Logs
      await dbRun("INSERT INTO practice_logs (username, minutes, date, notes) VALUES (?, ?, ?, ?)", ["ashley", 30, "2026-05-28", "Worked on C major scales and the first few bars of Fur Elise."]);
      await dbRun("INSERT INTO practice_logs (username, minutes, date, notes) VALUES (?, ?, ? ,?)", ["ashley", 20, "2026-05-27", "Practiced fingering for Moonlight Sonata chord changes."]);

      // Seed Free Practice Stats
      await dbRun("INSERT INTO free_practice (username, type, score, date) VALUES (?, ?, ?, ?)", ["ashley", "chord", 8, "2026-05-28"]);
      await dbRun("INSERT INTO free_practice (username, type, score, date) VALUES (?, ?, ?, ?)", ["ashley", "note", 14, "2026-05-27"]);

      // Seed Shared Videos
      await dbRun("INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)", ["Für Elise", "Bars 1-8 (Slow Demonstration)", "https://www.youtube.com/embed/n4_w43RkS90", "ashley", "Beethoven"]);
      await dbRun("INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)", ["Moonlight Sonata", "First Movement (Slow Tutorial)", "https://www.youtube.com/embed/p1o1NnbV3C8", "ashley", "Beethoven"]);
      await dbRun("INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)", ["Chopin - Nocturne", "Op. 9 No. 2 (Bars 1-4 slow walk)", "https://www.youtube.com/embed/G1N4y8yGZUA", "ashley", "Chopin"]);

      // Seed Video Comments
      await dbRun("INSERT INTO video_comments (videoId, username, name, text, createdAt) VALUES (?, ?, ?, ?, ?)", [1, "ashley", "Ashley", "Is it normal if my fingers hurt when doing this? 😭", "2026-05-28T10:30:00Z"]);
      await dbRun("INSERT INTO video_comments (videoId, username, name, text, createdAt) VALUES (?, ?, ?, ?, ?)", [1, "teacher", "Mr. Smith", "A little tension is normal initially, but relax your wrist and arch your fingers! 🎹", "2026-05-28T11:15:00Z"]);

      console.log("Mock database seeding completed.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
}

module.exports = {
  dbRun,
  dbQueryGet,
  dbQueryAll
};
