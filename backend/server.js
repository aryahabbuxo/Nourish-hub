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
      student_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE
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

    // Feedback table with INTEGER rating (1-5)
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      feedback_text TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      meal_type TEXT,
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

    // Weekly menu voting options table
    db.run(`CREATE TABLE IF NOT EXISTS weekly_menu_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      option_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(day, meal_type, option_text)
    )`);

    // Weekly votes table
    db.run(`CREATE TABLE IF NOT EXISTS weekly_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      day TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      option_text TEXT NOT NULL,
      voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, day, meal_type)
    )`);

    // Clean up old voting tables (one-time migration)
    db.run("DROP TABLE IF EXISTS voting_options", (err) => {
      if (!err) console.log("✓ Removed old voting_options table");
    });

    db.run("DROP TABLE IF EXISTS votes", (err) => {
      if (!err) console.log("✓ Removed old votes table");
    });

    db.run("DROP TABLE IF EXISTS menu_votes", (err) => {
      if (!err) console.log("✓ Removed old menu_votes table");
    });

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
        const statuses = ["yes", "limited", "tiffin", "skip"];
        db.run(
          "INSERT INTO meal_preferences (student_id, meal_type, date, eating_status, portion_size) VALUES (?, ?, ?, ?, ?)",
          [
            studentId,
            "lunch",
            today,
            statuses[Math.floor(Math.random() * 4)],
            portions[Math.floor(Math.random() * 3)],
          ]
        );
      }

      for (let i = 0; i < 230; i++) {
        const studentId = `STU${String(Math.floor(Math.random() * 500) + 1).padStart(3, "0")}`;
        const portions = ["small", "medium", "large"];
        const statuses = ["yes", "limited", "tiffin", "skip"];
        db.run(
          "INSERT INTO meal_preferences (student_id, meal_type, date, eating_status, portion_size) VALUES (?, ?, ?, ?, ?)",
          [
            studentId,
            "dinner",
            today,
            statuses[Math.floor(Math.random() * 4)],
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

// Mess Manager sets today's menu (Lunch/Dinner)
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

// Submit meal preference
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

// ============================================
// WEEKLY MENU VOTING ENDPOINTS
// ============================================

// Get weekly menu options
app.get("/api/voting/weekly-options", (req, res) => {
  db.all(
    "SELECT day, meal_type, option_text FROM weekly_menu_options ORDER BY id",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching weekly options:", err);
        return res.json({});
      }

      const options = {};
      rows.forEach((row) => {
        if (!options[row.day]) {
          options[row.day] = { lunch: [], dinner: [] };
        }
        options[row.day][row.meal_type].push(row.option_text);
      });

      res.json(options);
    }
  );
});

// Set weekly menu options (Manager)
app.post("/api/voting/weekly-options", (req, res) => {
  const weeklyData = req.body; // { Monday: { lunch: [...], dinner: [...] }, ... }

  console.log("Received weekly menu data:", JSON.stringify(weeklyData, null, 2));

  // Clear existing options
  db.run("DELETE FROM weekly_menu_options", [], (err) => {
    if (err) {
      console.error("Error clearing weekly options:", err);
      return res.json({ success: false, error: "Failed to clear old options" });
    }

    const insertPromises = [];

    // Insert all new options
    Object.keys(weeklyData).forEach((day) => {
      // Insert lunch options
      if (weeklyData[day].lunch && Array.isArray(weeklyData[day].lunch)) {
        weeklyData[day].lunch.forEach((option) => {
          if (option && option.trim()) {
            insertPromises.push(
              new Promise((resolve, reject) => {
                db.run(
                  "INSERT INTO weekly_menu_options (day, meal_type, option_text) VALUES (?, ?, ?)",
                  [day, "lunch", option.trim()],
                  (err) => {
                    if (err) {
                      console.error(`Error inserting ${day} lunch option:`, err);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              })
            );
          }
        });
      }

      // Insert dinner options
      if (weeklyData[day].dinner && Array.isArray(weeklyData[day].dinner)) {
        weeklyData[day].dinner.forEach((option) => {
          if (option && option.trim()) {
            insertPromises.push(
              new Promise((resolve, reject) => {
                db.run(
                  "INSERT INTO weekly_menu_options (day, meal_type, option_text) VALUES (?, ?, ?)",
                  [day, "dinner", option.trim()],
                  (err) => {
                    if (err) {
                      console.error(`Error inserting ${day} dinner option:`, err);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              })
            );
          }
        });
      }
    });

    Promise.all(insertPromises)
      .then(() => {
        console.log("All weekly options inserted successfully");
        res.json({ success: true });
      })
      .catch((err) => {
        console.error("Error during batch insert:", err);
        res.json({ success: false, error: "Failed to insert some options" });
      });
  });
});

// Submit weekly vote
app.post("/api/voting/weekly-vote", (req, res) => {
  const { student_id, day, meal_type, option_text } = req.body;

  console.log("Vote received:", { student_id, day, meal_type, option_text });

  db.run(
    `INSERT OR REPLACE INTO weekly_votes (student_id, day, meal_type, option_text) 
     VALUES (?, ?, ?, ?)`,
    [student_id, day, meal_type, option_text],
    function (err) {
      if (err) {
        console.error("Error submitting vote:", err);
        return res.json({ success: false, error: err.message });
      }
      console.log("Vote saved successfully, ID:", this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get weekly vote results
app.get("/api/voting/weekly-results", (req, res) => {
  db.all(
    "SELECT day, meal_type, option_text, COUNT(*) as votes FROM weekly_votes GROUP BY day, meal_type, option_text",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching vote results:", err);
        return res.json({});
      }

      const results = {};
      rows.forEach((row) => {
        const key = `${row.day}_${row.meal_type}`;
        if (!results[key]) {
          results[key] = {};
        }
        results[key][row.option_text] = row.votes;
      });

      console.log("Vote results:", JSON.stringify(results, null, 2));
      res.json(results);
    }
  );
});

// ============================================
// END WEEKLY VOTING ENDPOINTS
// ============================================

// Get meal statistics
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
          limited: 0,
          tiffin: 0,
          skip: 0,
          portions: { small: 0, medium: 0, large: 0 },
        },
        dinner: {
          total: 0,
          yes: 0,
          limited: 0,
          tiffin: 0,
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

// Submit feedback with star rating (1-5)
app.post("/api/feedback", (req, res) => {
  const { student_id, feedback_text, rating, meal_type } = req.body;

  // rating is now 1-5 integer
  const numericRating = parseInt(rating);

  if (numericRating < 1 || numericRating > 5) {
    return res.json({ success: false, error: "Rating must be between 1 and 5" });
  }

  db.run(
    "INSERT INTO feedback (student_id, feedback_text, rating, meal_type) VALUES (?, ?, ?, ?)",
    [student_id, feedback_text || "", numericRating, meal_type],
    function (err) {
      if (err) {
        console.error(err);
        return res.json({ success: false });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get recent feedback
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

// Get dashboard metrics
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

    // Average rating and count from last 7 days
    new Promise((resolve, reject) => {
      db.get(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM feedback WHERE created_at >= date('now', '-7 days')",
        [],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    }),
  ])
    .then(([todayCount, lastWeekCount, feedbackData]) => {
      const confirmationRate = Math.round((todayCount / 500) * 100);
      const avgRating = feedbackData?.avg_rating || 0;
      const totalRatings = feedbackData?.total_ratings || 0;

      // Demo values
      const wasteReduction = 28;
      const costSavings = 17000;

      res.json({
        wasteReduction: {
          value: `${wasteReduction}%`,
          change: "+3% vs last week",
          trend: "up",
        },
        costSavings: {
          value: `₹${Math.round(costSavings / 1000)}K`,
          change: "+₹2K vs last week",
          trend: "up",
        },
        confirmationRate: {
          value: `${confirmationRate}%`,
          change: "+5% vs last week",
          trend: "up",
        },
        avgSatisfaction: {
          value: avgRating > 0 ? `${avgRating.toFixed(1)}/5.0` : "No ratings yet",
          change: totalRatings > 0 ? `Based on ${totalRatings} ratings` : "",
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

✅ Features Enabled:
- Weekly voting system (day-wise)
- Star rating system (1-5)
- Portion sizes in grams
- Enhanced meal options

API Endpoints:
- GET  /api/health
- GET  /api/menu/today
- POST /api/menu/set
- POST /api/preferences
- GET  /api/stats/today
- POST /api/feedback (⭐ star ratings)
- GET  /api/feedback/recent
- GET  /api/metrics

Weekly Voting Endpoints:
- GET  /api/voting/weekly-options
- POST /api/voting/weekly-options
- POST /api/voting/weekly-vote
- GET  /api/voting/weekly-results

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
