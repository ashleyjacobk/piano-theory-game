const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to SQLite Database for seeding:", dbPath);
  seed();
});

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

async function seed() {
  try {
    console.log("Cleaning database tables...");
    await dbRun("DELETE FROM users");
    await dbRun("DELETE FROM videos");
    await dbRun("DELETE FROM homework");
    await dbRun("DELETE FROM practice_logs");
    await dbRun("DELETE FROM free_practice");
    await dbRun("DELETE FROM archived_songs");
    await dbRun("DELETE FROM video_comments");

    console.log("Seeding Teacher: John Smith...");
    // Seed teacher with username 'teacher' so the user can easily log in, and also 'john_smith'
    await dbRun(
      "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["teacher", "john@piano.com", "password", "John Smith", "teacher", "SMITH101", "Wednesday"]
    );
    await dbRun(
      "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["john_smith", "johnsmith@piano.com", "password", "John Smith", "teacher", "SMITH101", "Wednesday"]
    );

    console.log("Seeding Students...");
    const students = [
      { username: "elizabeth", name: "Elizabeth" },
      { username: "hannah", name: "Hannah" },
      { username: "emma", name: "Emma" },
      { username: "jaison", name: "Jaison" },
      { username: "marilyn", name: "Marilyn" },
      { username: "brian", name: "Brian" },
      { username: "joe", name: "Joe" },
      { username: "joseph", name: "Joseph" },
      { username: "mary", name: "Mary" },
      { username: "theresa", name: "Theresa" },
      { username: "sebastian", name: "Sebastian" },
      { username: "rose", name: "Rose" },
      { username: "juno", name: "Juno" },
      { username: "jessica", name: "Jessica" }
    ];

    for (const student of students) {
      await dbRun(
        "INSERT INTO users (username, email, password, name, role, teacherCode, lessonDay) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          student.username,
          `${student.username}@piano.com`,
          "password",
          student.name,
          "student",
          "SMITH101",
          "Wednesday"
        ]
      );
    }

    console.log("Seeding unique songs for each student...");
    const songMappings = [
      {
        student: "elizabeth",
        songs: [
          { songName: "Für Elise", title: "Für Elise (Demonstration)", url: "https://www.youtube.com/embed/n4_w43RkS90", composer: "Beethoven" },
          { songName: "Clair de Lune", title: "Clair de Lune (Practice Guide)", url: "https://www.youtube.com/embed/WNcsANYpGyo", composer: "Debussy" }
        ]
      },
      {
        student: "hannah",
        songs: [
          { songName: "Moonlight Sonata", title: "Moonlight Sonata (Slow Practice)", url: "https://www.youtube.com/embed/p1o1NnbV3C8", composer: "Beethoven" },
          { songName: "Canon in D", title: "Canon in D (Tutorial)", url: "https://www.youtube.com/embed/jXP-d779K-4", composer: "Pachelbel" }
        ]
      },
      {
        student: "emma",
        songs: [
          { songName: "Chopin - Nocturne", title: "Nocturne Op. 9 No. 2 (Walkthrough)", url: "https://www.youtube.com/embed/G1N4y8yGZUA", composer: "Chopin" },
          { songName: "Minuet in G", title: "Minuet in G Major (Tutorial)", url: "https://www.youtube.com/embed/on9CbyNisD8", composer: "Bach" }
        ]
      },
      {
        student: "jaison",
        songs: [
          { songName: "Gymnopédie No. 1", title: "Gymnopédie No. 1 (Practice Guide)", url: "https://www.youtube.com/embed/S-Xm7s9eOrc", composer: "Satie" },
          { songName: "Prelude in C Major", title: "Prelude in C Major (Slow Tutorial)", url: "https://www.youtube.com/embed/gVah1cr3tY0", composer: "Bach" }
        ]
      },
      {
        student: "marilyn",
        songs: [
          { songName: "Rondo alla Turca", title: "Turkish March (Speed Guide)", url: "https://www.youtube.com/embed/1vPmrNe6FRM", composer: "Mozart" },
          { songName: "Ode to Joy", title: "Ode to Joy (Easy Lesson)", url: "https://www.youtube.com/embed/Wod-Gr_F11I", composer: "Beethoven" }
        ]
      },
      {
        student: "brian",
        songs: [
          { songName: "The Entertainer", title: "The Entertainer (Ragtime Lesson)", url: "https://www.youtube.com/embed/fPmruHc4S9Y", composer: "Joplin" },
          { songName: "Waltz in A minor", title: "Waltz in A minor (Slow Demonstration)", url: "https://www.youtube.com/embed/alRL5S1647Q", composer: "Chopin" }
        ]
      },
      {
        student: "joe",
        songs: [
          { songName: "River Flows in You", title: "River Flows in You (Demonstration)", url: "https://www.youtube.com/embed/7maJOI3QMu0", composer: "Yiruma" },
          { songName: "Fantaisie-Impromptu", title: "Fantaisie-Impromptu (Practice Guide)", url: "https://www.youtube.com/embed/75x1HL5Jzsc", composer: "Chopin" }
        ]
      },
      {
        student: "joseph",
        songs: [
          { songName: "Comptine d'un autre été", title: "Amélie Theme (Walkthrough)", url: "https://www.youtube.com/embed/4Z2LjWwLHnI", composer: "Tiersen" },
          { songName: "Hallelujah", title: "Hallelujah (Easy Tutorial)", url: "https://www.youtube.com/embed/T29h2nle6sY", composer: "Cohen" }
        ]
      },
      {
        student: "mary",
        songs: [
          { songName: "To A Wild Rose", title: "To A Wild Rose (Slow Practice)", url: "https://www.youtube.com/embed/Rk5T1N6L2b4", composer: "MacDowell" },
          { songName: "Prelude in E Minor", title: "Prelude in E Minor (Tutorial)", url: "https://www.youtube.com/embed/ef-4Bv5Py00", composer: "Chopin" }
        ]
      },
      {
        student: "theresa",
        songs: [
          { songName: "Arabesque No. 1", title: "Arabesque No. 1 (Practice Guide)", url: "https://www.youtube.com/embed/rP25bZ1u4E4", composer: "Debussy" },
          { songName: "Pathetique Sonata", title: "Pathetique Sonata 2nd Mvt (Slow)", url: "https://www.youtube.com/embed/zH3lG_e8oK4", composer: "Beethoven" }
        ]
      },
      {
        student: "sebastian",
        songs: [
          { songName: "Maple Leaf Rag", title: "Maple Leaf Rag (Detailed Lesson)", url: "https://www.youtube.com/embed/pMAtL75SlSM", composer: "Joplin" },
          { songName: "Solfeggietto", title: "Solfeggietto (Speed Practice)", url: "https://www.youtube.com/embed/9Bv_d0Q9wXU", composer: "C.P.E. Bach" }
        ]
      },
      {
        student: "rose",
        songs: [
          { songName: "Minuet in G minor", title: "Minuet in G minor (Tutorial)", url: "https://www.youtube.com/embed/Fw0Wk1d8T9k", composer: "Bach" },
          { songName: "Sonata Facile", title: "Mozart Sonata K.545 (Slow Demonstration)", url: "https://www.youtube.com/embed/z2U8Pq1LhP8", composer: "Mozart" }
        ]
      },
      {
        student: "juno",
        songs: [
          { songName: "La Campanella", title: "La Campanella (Practice Guide)", url: "https://www.youtube.com/embed/H1Dvg2MxQn8", composer: "Liszt" },
          { songName: "Liebestraum No. 3", title: "Liebestraum No. 3 (Slow)", url: "https://www.youtube.com/embed/Y4XEPdYK548", composer: "Liszt" }
        ]
      },
      {
        student: "jessica",
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

    // Insert a few practice logs for active feel
    console.log("Seeding sample practice logs...");
    await dbRun("INSERT INTO practice_logs (username, minutes, date, notes, songName) VALUES (?, ?, ?, ?, ?)", [
      "elizabeth",
      30,
      new Date().toISOString().split("T")[0],
      "Practiced scales and first page of Für Elise",
      "Für Elise"
    ]);
    await dbRun("INSERT INTO practice_logs (username, minutes, date, notes, songName) VALUES (?, ?, ?, ?, ?)", [
      "hannah",
      45,
      new Date().toISOString().split("T")[0],
      "Slow practice on Moonlight Sonata, focused on smooth arpeggios.",
      "Moonlight Sonata"
    ]);

    console.log("Database seeded successfully with John Smith and 14 students!");
    db.close();
  } catch (err) {
    console.error("Error during seeding:", err.message);
    db.close();
    process.exit(1);
  }
}
