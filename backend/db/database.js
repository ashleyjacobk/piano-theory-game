const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.db");

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

    // Migration checks
    try {
      await dbRun("ALTER TABLE videos ADD COLUMN studentUsername TEXT");
    } catch {}

    try {
      await dbRun("ALTER TABLE videos ADD COLUMN composer TEXT");
    } catch {}

    try {
      await dbRun("ALTER TABLE homework ADD COLUMN dueDate TEXT");
    } catch {}

    try {
      await dbRun("ALTER TABLE homework ADD COLUMN songName TEXT");
    } catch {}

    try {
      await dbRun("ALTER TABLE users ADD COLUMN lessonDay TEXT DEFAULT 'Wednesday'");
    } catch {}

    try {
      await dbRun("ALTER TABLE practice_logs ADD COLUMN songName TEXT");
    } catch {}

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

    try {
      await dbRun("ALTER TABLE video_comments ADD COLUMN readByTeacher INTEGER DEFAULT 0");
    } catch {}

    try {
      await dbRun("ALTER TABLE video_comments ADD COLUMN readByStudent INTEGER DEFAULT 0");
    } catch {}

    console.log("Database tables initialized successfully.");

    // Seed mock data if database is fresh or ashley@piano.com is missing (trigger clear & reset)
    const ashleyUser = await dbQueryGet("SELECT * FROM users WHERE LOWER(username) = ?", ["ashley@piano.com"]);
    
    if (!ashleyUser) {
      console.log("Database reset: ashley@piano.com not found. Wiping and pre-seeding default mock data...");
      await dbRun("DELETE FROM users");
      await dbRun("DELETE FROM videos");
      await dbRun("DELETE FROM homework");
      await dbRun("DELETE FROM practice_logs");
      await dbRun("DELETE FROM free_practice");
      await dbRun("DELETE FROM archived_songs");
      await dbRun("DELETE FROM video_comments");

      // Seed Teachers
      await dbRun(
        "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["teacher@piano.com", "teacher@piano.com", "password", "John Smith", "teacher", "SMITH101", "Wednesday"]
      );
      await dbRun(
        "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["johnsmith@piano.com", "johnsmith@piano.com", "password", "John Smith", "teacher", "SMITH101", "Wednesday"]
      );

      // Seed Student ashley@piano.com
      await dbRun(
        "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["ashley@piano.com", "ashley@piano.com", "password", "Ashley", "student", "SMITH101", "Wednesday"]
      );

      // Seed other standard students
      const students = [
        { username: "elizabeth@piano.com", name: "Elizabeth" },
        { username: "hannah@piano.com", name: "Hannah" },
        { username: "emma@piano.com", name: "Emma" },
        { username: "jaison@piano.com", name: "Jaison" },
        { username: "marilyn@piano.com", name: "Marilyn" },
        { username: "brian@piano.com", name: "Brian" },
        { username: "joe@piano.com", name: "Joe" },
        { username: "joseph@piano.com", name: "Joseph" },
        { username: "mary@piano.com", name: "Mary" },
        { username: "theresa@piano.com", name: "Theresa" },
        { username: "sebastian@piano.com", name: "Sebastian" },
        { username: "rose@piano.com", name: "Rose" },
        { username: "juno@piano.com", name: "Juno" },
        { username: "jessica@piano.com", name: "Jessica" }
      ];

      for (const student of students) {
        await dbRun(
          "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [student.username, student.username, "password", student.name, "student", "SMITH101", "Wednesday"]
        );
      }

      const songMappings = [
        {
          student: "elizabeth@piano.com",
          songs: [
            { songName: "Für Elise", title: "Für Elise (Demonstration)", url: "https://www.youtube.com/embed/n4_w43RkS90", composer: "Beethoven" },
            { songName: "Clair de Lune", title: "Clair de Lune (Practice Guide)", url: "https://www.youtube.com/embed/WNcsANYpGyo", composer: "Debussy" }
          ]
        },
        {
          student: "hannah@piano.com",
          songs: [
            { songName: "Moonlight Sonata", title: "Moonlight Sonata (Slow Practice)", url: "https://www.youtube.com/embed/p1o1NnbV3C8", composer: "Beethoven" },
            { songName: "Canon in D", title: "Canon in D (Tutorial)", url: "https://www.youtube.com/embed/jXP-d779K-4", composer: "Pachelbel" }
          ]
        },
        {
          student: "emma@piano.com",
          songs: [
            { songName: "Chopin - Nocturne", title: "Nocturne Op. 9 No. 2 (Walkthrough)", url: "https://www.youtube.com/embed/G1N4y8yGZUA", composer: "Chopin" },
            { songName: "Minuet in G", title: "Minuet in G Major (Tutorial)", url: "https://www.youtube.com/embed/on9CbyNisD8", composer: "Bach" }
          ]
        },
        {
          student: "jaison@piano.com",
          songs: [
            { songName: "Gymnopédie No. 1", title: "Gymnopédie No. 1 (Practice Guide)", url: "https://www.youtube.com/embed/S-Xm7s9eOrc", composer: "Satie" },
            { songName: "Prelude in C Major", title: "Prelude in C Major (Slow Tutorial)", url: "https://www.youtube.com/embed/gVah1cr3tY0", composer: "Bach" }
          ]
        },
        {
          student: "marilyn@piano.com",
          songs: [
            { songName: "Rondo alla Turca", title: "Turkish March (Speed Guide)", url: "https://www.youtube.com/embed/1vPmrNe6FRM", composer: "Mozart" },
            { songName: "Ode to Joy", title: "Ode to Joy (Easy Lesson)", url: "https://www.youtube.com/embed/Wod-Gr_F11I", composer: "Beethoven" }
          ]
        },
        {
          student: "brian@piano.com",
          songs: [
            { songName: "The Entertainer", title: "The Entertainer (Ragtime Lesson)", url: "https://www.youtube.com/embed/fPmruHc4S9Y", composer: "Joplin" },
            { songName: "Waltz in A minor", title: "Waltz in A minor (Slow Demonstration)", url: "https://www.youtube.com/embed/alRL5S1647Q", composer: "Chopin" }
          ]
        },
        {
          student: "joe@piano.com",
          songs: [
            { songName: "River Flows in You", title: "River Flows in You (Demonstration)", url: "https://www.youtube.com/embed/7maJOI3QMu0", composer: "Yiruma" },
            { songName: "Fantaisie-Impromptu", title: "Fantaisie-Impromptu (Practice Guide)", url: "https://www.youtube.com/embed/75x1HL5Jzsc", composer: "Chopin" }
          ]
        },
        {
          student: "joseph@piano.com",
          songs: [
            { songName: "Comptine d'un autre été", title: "Amélie Theme (Walkthrough)", url: "https://www.youtube.com/embed/4Z2LjWwLHnI", composer: "Tiersen" },
            { songName: "Hallelujah", title: "Hallelujah (Easy Tutorial)", url: "https://www.youtube.com/embed/T29h2nle6sY", composer: "Cohen" }
          ]
        },
        {
          student: "mary@piano.com",
          songs: [
            { songName: "To A Wild Rose", title: "To A Wild Rose (Slow Practice)", url: "https://www.youtube.com/embed/Rk5T1N6L2b4", composer: "MacDowell" },
            { songName: "Prelude in E Minor", title: "Prelude in E Minor (Tutorial)", url: "https://www.youtube.com/embed/ef-4Bv5Py00", composer: "Chopin" }
          ]
        },
        {
          student: "theresa@piano.com",
          songs: [
            { songName: "Arabesque No. 1", title: "Arabesque No. 1 (Practice Guide)", url: "https://www.youtube.com/embed/rP25bZ1u4E4", composer: "Debussy" },
            { songName: "Pathetique Sonata", title: "Pathetique Sonata 2nd Mvt (Slow)", url: "https://www.youtube.com/embed/zH3lG_e8oK4", composer: "Beethoven" }
          ]
        },
        {
          student: "sebastian@piano.com",
          songs: [
            { songName: "Maple Leaf Rag", title: "Maple Leaf Rag (Detailed Lesson)", url: "https://www.youtube.com/embed/pMAtL75SlSM", composer: "Joplin" },
            { songName: "Solfeggietto", title: "Solfeggietto (Speed Practice)", url: "https://www.youtube.com/embed/9Bv_d0Q9wXU", composer: "C.P.E. Bach" }
          ]
        },
        {
          student: "rose@piano.com",
          songs: [
            { songName: "Minuet in G minor", title: "Minuet in G minor (Tutorial)", url: "https://www.youtube.com/embed/Fw0Wk1d8T9k", composer: "Bach" },
            { songName: "Sonata Facile", title: "Mozart Sonata K.545 (Slow Demonstration)", url: "https://www.youtube.com/embed/z2U8Pq1LhP8", composer: "Mozart" }
          ]
        },
        {
          student: "juno@piano.com",
          songs: [
            { songName: "La Campanella", title: "La Campanella (Practice Guide)", url: "https://www.youtube.com/embed/H1Dvg2MxQn8", composer: "Liszt" },
            { songName: "Liebestraum No. 3", title: "Liebestraum No. 3 (Slow)", url: "https://www.youtube.com/embed/Y4XEPdYK548", composer: "Liszt" }
          ]
        },
        {
          student: "jessica@piano.com",
          songs: [
            { songName: "Ave Maria", title: "Ave Maria (Easy Lesson)", url: "https://www.youtube.com/embed/2bosouy5DGA", composer: "Schubert" },
            { songName: "Morning Mood", title: "Morning Mood (Walkthrough)", url: "https://www.youtube.com/embed/kzDQyM47NBY", composer: "Grieg" }
          ]
        }
      ];

      for (const mapping of songMappings) {
        for (const song of mapping.songs) {
          await dbRun(
            "INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)",
            [song.songName, song.title, song.url, mapping.student, song.composer]
          );
        }
      }

      await dbRun("INSERT INTO practice_logs (username, minutes, date, notes, songName) VALUES (?, ?, ?, ?, ?)", [
        "elizabeth@piano.com",
        30,
        new Date().toISOString().split("T")[0],
        "Practiced scales and first page of Für Elise",
        "Für Elise"
      ]);
      await dbRun("INSERT INTO practice_logs (username, minutes, date, notes, songName) VALUES (?, ?, ?, ?, ?)", [
        "hannah@piano.com",
        45,
        new Date().toISOString().split("T")[0],
        "Slow practice on Moonlight Sonata, focused on smooth arpeggios.",
        "Moonlight Sonata"
      ]);

      console.log("Mock database seeding completed successfully.");
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
