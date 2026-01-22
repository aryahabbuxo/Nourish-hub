// server.js - Complete Backend for NOURISH-HUB (SQLite ONLY)
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database("./nourish_hub.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

function getNextWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon...
  const diffToMonday = (day === 0 ? 1 : 8 - day); // next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + diffToMonday);
  return nextMonday.toISOString().split("T")[0];
}


// Create tables
function initializeDatabase() {
  db.serialize(() => {
    // Students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE,
      name TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Meal preferences table
    db.run(`CREATE TABLE IF NOT EXISTS meal_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      meal_type TEXT,
      date DATE,
      eating_status TEXT,
      portion_size TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    )`);

    // Feedback table
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      feedback_text TEXT,
      rating TEXT,
      meal_type TEXT,
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    )`);

    // Menu table
    db.run(`CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE,
      meal_type TEXT,
      items TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Menu voting table
db.run(`CREATE TABLE IF NOT EXISTS menu_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT,
  meal_type TEXT,
  option_text TEXT,
  date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

   // Voting options table (manager controlled)
db.run(`CREATE TABLE IF NOT EXISTS voting_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start DATE,
  meal_type TEXT,
  items TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_start, meal_type)
)`);


    insertSampleData();
  });
}

function insertSampleData() {
  const today = new Date().toISOString().split("T")[0];

  // Insert sample students
  const sampleStudents = [
    ["STU001", "Rahul Kumar", "rahul@example.com"],
    ["STU002", "Priya Sharma", "priya@example.com"],
    ["STU003", "Amit Patel", "amit@example.com"],
  ];

  sampleStudents.forEach((student) => {
    db.run(
      "INSERT OR IGNORE INTO students (student_id, name, email) VALUES (?, ?, ?)",
      student,
      (err) => {
        if (err && err.code !== "SQLITE_CONSTRAINT") {
          console.error("Error inserting student:", err);
        }
      }
    );
  });

  // Insert today's menu (only once)
  const menuItems = [
    [
      today,
      "lunch",
      JSON.stringify([
        "Dal Tadka + Jeera Rice",
        "Mixed Veg Curry + Raita + Papad",
        "Gulab Jamun",
      ]),
    ],
    [
      today,
      "dinner",
      JSON.stringify([
        "Paneer Butter Masala + Roti",
        "Dal Fry + Aloo Sabzi + Salad",
        "Ice Cream",
      ]),
    ],
  ];



  menuItems.forEach((menu) => {
    db.run(
      "INSERT OR IGNORE INTO menu (date, meal_type, items) VALUES (?, ?, ?)",
      menu,
      (err) => {
        if (err && err.code !== "SQLITE_CONSTRAINT") {
          console.error("Error inserting menu:", err);
        }
      }
    );
  });


// ✅ Insert default voting options if not present
const nextWeek = getNextWeekStart();

const defaultVoting = [
  [
    nextWeek,
    "lunch",
    JSON.stringify(["Rajma Chawal", "Veg Biryani", "Chole Bhature", "South Indian Meals"]),
  ],
  [
    nextWeek,
    "dinner",
    JSON.stringify(["Paneer Tikka + Roti", "Veg Fried Rice + Manchurian", "Dal Makhani + Naan", "Pav Bhaji"]),
  ],
];

defaultVoting.forEach((row) => {
  db.run(
    "INSERT OR IGNORE INTO voting_options (week_start, meal_type, items) VALUES (?, ?, ?)",
    row
  );
});

  // OPTIONAL: Insert sample preferences only if table empty for today
  db.get(
    "SELECT COUNT(*) AS count FROM meal_preferences WHERE date = ?",
    [today],
    (err, row) => {
      if (err) return;
      if (row.count > 0) return; // already has data

      for (let i = 0; i < 200; i++) {
        const studentId = `STU${String(Math.floor(Math.random() * 500) + 1).padStart(3, "0")}`;
        const portions = ["small", "medium", "large"];
        const statuses = ["yes", "partial", "skip"];
        db.run(
          "INSERT INTO meal_preferences (student_id, meal_type, date, eating_status, portion_size) VALUES (?, ?, ?, ?, ?)",
          [
            studentId,
            "lunch",
            today,
            statuses[Math.floor(Math.random() * 3)],
            portions[Math.floor(Math.random() * 3)],
          ]
        );
      }

      for (let i = 0; i < 230; i++) {
        const studentId = `STU${String(Math.floor(Math.random() * 500) + 1).padStart(3, "0")}`;
        const portions = ["small", "medium", "large"];
        const statuses = ["yes", "partial", "skip"];
        db.run(
          "INSERT INTO meal_preferences (student_id, meal_type, date, eating_status, portion_size) VALUES (?, ?, ?, ?, ?)",
          [
            studentId,
            "dinner",
            today,
            statuses[Math.floor(Math.random() * 3)],
            portions[Math.floor(Math.random() * 3)],
          ]
        );
      }

      console.log("✅ Inserted sample preferences for today");
    }
  );
}

// ==================== API ENDPOINTS ====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get today's menu
app.get("/api/menu/today", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all("SELECT * FROM menu WHERE date = ?", [today], (err, rows) => {
    if (err) {
      console.error("Error fetching menu:", err);
      return res.status(500).json({ error: "Failed to fetch menu" });
    }

    const menu = {};
    rows.forEach((row) => {
      menu[row.meal_type] = {
        items: JSON.parse(row.items),
        date: row.date,
      };
    });

    res.json(menu);
  });
});

// ✅ NEW: Mess Manager sets today's menu (Lunch/Dinner)
app.post("/api/menu/set", (req, res) => {
  const { meal_type, items } = req.body;
  const today = new Date().toISOString().split("T")[0];

  if (!meal_type || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: "meal_type and items[] are required" });
  }

  const itemsJson = JSON.stringify(items);

  // Delete old menu for today + meal_type
  db.run(
    "DELETE FROM menu WHERE date = ? AND meal_type = ?",
    [today, meal_type],
    (err) => {
      if (err) {
        console.error("Error deleting menu:", err);
        return res.status(500).json({ error: "Failed to update menu" });
      }

      // Insert new menu
      db.run(
        "INSERT INTO menu (date, meal_type, items) VALUES (?, ?, ?)",
        [today, meal_type, itemsJson],
        function (err2) {
          if (err2) {
            console.error("Error inserting menu:", err2);
            return res.status(500).json({ error: "Failed to save menu" });
          }

          res.json({ success: true, message: "Menu updated successfully ✅" });
        }
      );
    }
  );
});

// Submit meal preference (✅ SQLite)
app.post("/api/preferences", (req, res) => {
  const { student_id, meal_type, eating_status, portion_size } = req.body;
  const today = new Date().toISOString().split("T")[0];

  if (!student_id || !meal_type || !eating_status || !portion_size) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Delete existing preference for this student + meal + today
  db.run(
    "DELETE FROM meal_preferences WHERE student_id = ? AND meal_type = ? AND date = ?",
    [student_id, meal_type, today],
    (err) => {
      if (err) {
        console.error("Error deleting old preference:", err);
        return res.status(500).json({ error: "Failed to update preference" });
      }

      // Insert new preference
      db.run(
        "INSERT INTO meal_preferences (student_id, meal_type, date, eating_status, portion_size) VALUES (?, ?, ?, ?, ?)",
        [student_id, meal_type, today, eating_status, portion_size],
        function (err) {
          if (err) {
            console.error("Error inserting preference:", err);
            return res.status(500).json({ error: "Failed to save preference" });
          }

          res.json({
            success: true,
            id: this.lastID,
            message: "Preference saved successfully",
          });
        }
      );
    }
  );
});

// ✅ Get voting options (demo options for next week)
app.get("/api/voting/options", (req, res) => {
  const nextWeek = getNextWeekStart();

  db.all(
    "SELECT meal_type, items FROM voting_options WHERE week_start = ?",
    [nextWeek],
    (err, rows) => {
      if (err) {
        console.error("Error fetching voting options:", err);
        return res.status(500).json({ error: "Failed to fetch voting options" });
      }

      const options = { lunch: [], dinner: [] };

      rows.forEach((r) => {
        options[r.meal_type] = JSON.parse(r.items);
      });

      res.json(options);
    }
  );
});


// ✅ Submit vote
app.post("/api/voting/vote", (req, res) => {
  const { student_id, meal_type, option_text } = req.body;
  const today = new Date().toISOString().split("T")[0];

  if (!student_id || !meal_type || !option_text) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Remove previous vote by same student for same meal type today
  db.run(
    "DELETE FROM menu_votes WHERE student_id = ? AND meal_type = ? AND date = ?",
    [student_id, meal_type, today],
    (err) => {
      if (err) {
        console.error("Error deleting old vote:", err);
        return res.status(500).json({ error: "Failed to update vote" });
      }

      db.run(
        "INSERT INTO menu_votes (student_id, meal_type, option_text, date) VALUES (?, ?, ?, ?)",
        [student_id, meal_type, option_text, today],
        function (err2) {
          if (err2) {
            console.error("Error inserting vote:", err2);
            return res.status(500).json({ error: "Failed to save vote" });
          }

          res.json({ success: true, message: "Vote recorded" });
        }
      );
    }
  );
});

app.post("/api/voting/options", (req, res) => {
  const { lunchOptions, dinnerOptions } = req.body;
  const nextWeek = getNextWeekStart();

  if (!Array.isArray(lunchOptions) || !Array.isArray(dinnerOptions)) {
    return res.status(400).json({ error: "Options must be arrays" });
  }

  db.serialize(() => {
    db.run(
      "INSERT INTO voting_options (week_start, meal_type, items) VALUES (?, ?, ?) ON CONFLICT(week_start, meal_type) DO UPDATE SET items = excluded.items",
      [nextWeek, "lunch", JSON.stringify(lunchOptions)]
    );

    db.run(
      "INSERT INTO voting_options (week_start, meal_type, items) VALUES (?, ?, ?) ON CONFLICT(week_start, meal_type) DO UPDATE SET items = excluded.items",
      [nextWeek, "dinner", JSON.stringify(dinnerOptions)]
    );

    res.json({ success: true, message: "Voting options updated" });
  });
});


// ✅ Vote results (counts)
app.get("/api/voting/results", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all(
    `SELECT meal_type, option_text, COUNT(*) as count
     FROM menu_votes
     WHERE date = ?
     GROUP BY meal_type, option_text`,
    [today],
    (err, rows) => {
      if (err) {
        console.error("Error fetching voting results:", err);
        return res.status(500).json({ error: "Failed to fetch results" });
      }

      const results = { lunch: {}, dinner: {} };

      rows.forEach((r) => {
        if (!results[r.meal_type]) results[r.meal_type] = {};
        results[r.meal_type][r.option_text] = r.count;
      });

      res.json(results);
    }
  );
});


// Get meal statistics (✅ SQLite)
app.get("/api/stats/today", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all(
    `SELECT 
      meal_type,
      eating_status,
      portion_size,
      COUNT(*) as count
    FROM meal_preferences 
    WHERE date = ?
    GROUP BY meal_type, eating_status, portion_size`,
    [today],
    (err, rows) => {
      if (err) {
        console.error("Error fetching stats:", err);
        return res.status(500).json({ error: "Failed to fetch statistics" });
      }

      const stats = {
        lunch: {
          total: 0,
          yes: 0,
          partial: 0,
          skip: 0,
          portions: { small: 0, medium: 0, large: 0 },
        },
        dinner: {
          total: 0,
          yes: 0,
          partial: 0,
          skip: 0,
          portions: { small: 0, medium: 0, large: 0 },
        },
      };

      rows.forEach((row) => {
        const meal = stats[row.meal_type];
        if (meal) {
          meal.total += row.count;
          meal[row.eating_status] += row.count;

          if (row.eating_status !== "skip") {
            meal.portions[row.portion_size] += row.count;
          }
        }
      });

      res.json(stats);
    }
  );
});

// Submit feedback (✅ SQLite)
app.post("/api/feedback", (req, res) => {
  const { student_id, feedback_text, rating, meal_type } = req.body;
  const today = new Date().toISOString().split("T")[0];

  if (!student_id || !feedback_text) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    "INSERT INTO feedback (student_id, feedback_text, rating, meal_type, date) VALUES (?, ?, ?, ?, ?)",
    [student_id, feedback_text, rating || "neutral", meal_type || "general", today],
    function (err) {
      if (err) {
        console.error("Error inserting feedback:", err);
        return res.status(500).json({ error: "Failed to save feedback" });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "Feedback submitted successfully",
      });
    }
  );
});

// Get recent feedback (✅ SQLite)
app.get("/api/feedback/recent", (req, res) => {
  const limit = req.query.limit || 10;

  db.all(
    `SELECT 
      f.id,
      f.student_id,
      s.name as student_name,
      f.feedback_text,
      f.rating,
      f.meal_type,
      f.created_at
    FROM feedback f
    LEFT JOIN students s ON f.student_id = s.student_id
    ORDER BY f.created_at DESC
    LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error("Error fetching feedback:", err);
        return res.status(500).json({ error: "Failed to fetch feedback" });
      }

      const feedback = rows.map((row) => {
        const createdAt = new Date(row.created_at);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let timeAgo;
        if (diffDays > 0) timeAgo = `${diffDays}d ago`;
        else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
        else timeAgo = "Just now";

        return {
          id: row.id,
          name: row.student_name || `Student #${row.student_id}`,
          feedback: row.feedback_text,
          rating: row.rating,
          time: timeAgo,
        };
      });

      res.json(feedback);
    }
  );
});

// Get dashboard metrics (✅ SQLite)
app.get("/api/metrics", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  Promise.all([
    // Total confirmations today
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM meal_preferences WHERE date = ? AND eating_status != "skip"',
        [today],
        (err, row) => (err ? reject(err) : resolve(row.count))
      );
    }),

    // Total confirmations last week (demo)
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM meal_preferences WHERE date = ? AND eating_status != "skip"',
        [lastWeek],
        (err, row) => (err ? reject(err) : resolve(row.count))
      );
    }),

    // Feedback count last 7 days
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as total FROM feedback WHERE date >= ?",
        [lastWeek],
        (err, row) => (err ? reject(err) : resolve(row.total))
      );
    }),
  ])
    .then(([todayCount, lastWeekCount, feedbackCount]) => {
      const confirmationRate = Math.round((todayCount / 500) * 100);

      // Demo values
      const wasteReduction = 28;
      const costSavings = 17000;
      const avgSatisfaction = 4.2;

      res.json({
        wasteReduction: {
          value: `${wasteReduction}%`,
          change: "↓ 6% vs last week",
          trend: "down",
        },
        costSavings: {
          value: `₹${Math.round(costSavings / 1000)}k`,
          change: "Est. ₹15-20k/week",
          trend: "up",
        },
        confirmationRate: {
          value: `${confirmationRate}%`,
          change: todayCount >= lastWeekCount ? "↑ improving week-on-week" : "↓ needs improvement",
          trend: todayCount >= lastWeekCount ? "up" : "down",
        },
        avgSatisfaction: {
          value: `${avgSatisfaction}/5`,
          change: `Based on ${feedbackCount} responses`,
          trend: "up",
        },
      });
    })
    .catch((err) => {
      console.error("Error fetching metrics:", err);
      res.status(500).json({ error: "Failed to fetch metrics" });
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`
========================================
🚀 NOURISH-HUB Backend Server Running
========================================
Port: ${PORT}
Database: SQLite (nourish_hub.db)

API Endpoints:
- GET  /api/health
- GET  /api/menu/today
- POST /api/menu/set   ✅ (NEW)
- POST /api/preferences
- GET  /api/stats/today
- POST /api/feedback
- GET  /api/feedback/recent
- GET  /api/metrics

Ready to accept requests! 🎉
========================================
`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});