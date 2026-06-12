# 🎹 Piano Academy

Welcome to **Piano Academy**, an interactive gamified teacher-student portal designed to make learning the piano intuitive, engaging, and structured. 

This repository showcases a full-stack portfolio application with a kid-friendly neubrutalist frontend design, custom client-side audio synthesizing, interactive music theory minigames, and a modular SQLite backend.

---

##  Core Features

###  Instructor Features (Teacher Console)
* **Student Roster Management**: Expand detailed student cards to track practice stats or use condensed lists.
* **Practice Journal Insights**: Review a detailed chronological breakdown of student practice logs grouped by standard calendar weeks.
* **Smart Homework Planner**: Create homework tasks for Note Matching, Chord Building, Staff Reading, or physical practice routines, with clean due dates.
* **Lesson Video Library**:
  * Upload slow-mo lesson videos (supports drag-and-drop video files and YouTube embed links).
  * Share video folders linked to specific songs directly into a student's catalog.
  * Real-time student-teacher feedback comments section on shared videos.
* **Inbox Notifications**: Stay updated instantly when students leave new comments on lesson files.

###  Student Features (Practice Portal)
* **Interactive Neubrutalist Keyboard**: Click or tap keys to play custom audio synthesized using Web Audio APIs. Supports key label toggles (A-G, solfège, piano roll layout) and multi-octave switches.
* **Note Match Game**: Match random grand staff prompts to keyboard keys under high-contrast feedback guidance.
* **Chord Builder Game**: Construct complex major, minor, diminished, and augmented triad combinations on the keyboard.
* **Staff Reader Game**: Beautiful SVG-rendered sheet music reader. Type the correct note letter to score points. Plays the correct guide melody on incorrect answers to train the student's ear.
* **Arcade Timed Minigames**: Challenge students with a ticker clock to beat high scores.
* **Practice Logging Journal**: Log daily physical practice minutes and record notes for the teacher.

---

##  Tech Stack

### Frontend (Client)
* **Core**: React (built on [Vite](https://vite.dev/))
* **Styling**: Tailwind CSS & Vanilla CSS (Neubrutalist design system)
* **Sound Generation**: Web Audio API (real-time synthesizer)
* **Icons**: React Icons / custom SVG elements

### Backend (Server)
* **Runtime**: Node.js & Express
* **Database**: SQLite3 (automatically seeded on startup)
* **Utilities**: Custom YouTube URL parsers, calendar week boundaries managers
* **Routing**: Fully modular Express router architectures

---

##  How to Run the Project

### 📋 Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Start the Backend Server
Open your terminal and navigate to the `backend/` directory:
```bash
cd backend
npm install
npm run dev
```
*Note: The backend will start on [http://localhost:5000](http://localhost:5000). If no database exists, it will automatically create `database.db` and seed it with fresh demo credentials.*

### 2. Start the Frontend Server
Open a second terminal window and navigate to the project root directory:
```bash
npm install
npm run dev
```
*The frontend development server will launch on [http://localhost:5173](http://localhost:5173) (or next available port, e.g. 5174).*

---

## Quick Demo Credentials

For quick review, you can log in instantly with these pre-seeded demo accounts:

###  Teacher View
* **Email Address**: `teacher@piano.com`
* **Password**: `password`
* **Teacher Connection Code**: `SMITH101`

###  Student View
* **Email Address**: `ashley@piano.com`
* **Password**: `password`
* *(Successfully connected to John Smith's teacher code `SMITH101`)*

---

## Project Notice
> [!NOTE]
> This is a normal student/portfolio project in active development. It represents a hands-on learning project, demonstrating full-stack architecture, clean separation of concerns, and intuitive user experiences.
