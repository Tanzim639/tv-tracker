import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- MONGODB CONNECTION ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ---------------- SCHEMAS ---------------- */

// USER
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// SHOW
const showSchema = new mongoose.Schema({
  tvmazeId: Number, // ❌ removed unique
  name: String,
  poster: String,
  lastEpisode: String,
  lastAirDate: Date,
  nextEpisode: String,
  nextAirDate: Date,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Show = mongoose.model("Show", showSchema);

/* ---------------- AUTH MIDDLEWARE ---------------- */

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // 🔥 use 'id' to match login
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.send("TV Tracker API running");
});

/* ---------------- AUTH ROUTES ---------------- */

// SIGNUP
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
    });

    res.json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
});

// LOGIN
// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });

//     if (!user) return res.status(400).json({ message: "User not found" });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });
//     res.json({ token });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("LOGIN ATTEMPT:", username);

    const user = await User.findOne({ username });

    console.log("USER FOUND:", user);

    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);

    console.log("PASSWORD VALID:", valid);

    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err); // 🔥 THIS WILL SHOW REAL ISSUE
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- SEARCH SHOW ---------------- */

app.get("/search/:name", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.tvmaze.com/search/shows?q=${req.params.name}`,
    );

    const results = response.data;

    const formatted = await Promise.all(
      results.slice(0, 8).map(async (item) => {
        const show = item.show;

        const existing = await Show.findOne({
          tvmazeId: show.id,
          userId: req.userId, // ✅ check per user
        });

        return {
          tvmazeId: show.id,
          showName: show.name,
          poster: show.image?.medium || null,
          alreadyAdded: !!existing,
        };
      }),
    );

    res.json(formatted);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Search failed" });
  }
});

app.get("/show/:id", authMiddleware, async (req, res) => {
  try {
    const show = await Show.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    res.json(show);
  } catch (err) {
    res.status(500).json({ message: "Error fetching show" });
  }
});

/* ---------------- ADD SHOW ---------------- */
// app.post("/add-show", authMiddleware, async (req, res) => {
//   const { tvmazeId } = req.body;

//   try {
//     const showRes = await axios.get(`https://api.tvmaze.com/shows/${tvmazeId}`);

//     const show = showRes.data;

//     // check duplicate
//     const existing = await Show.findOne({
//       tvmazeId: show.id,
//       userId: req.userId,
//     });

//     if (existing) {
//       return res.json({ message: "Show already added" });
//     }

//     let prevEpisode = null;
//     let nextEpisode = null;

//     if (show._links.previousepisode) {
//       const prevRes = await axios.get(show._links.previousepisode.href);
//       prevEpisode = prevRes.data;
//     }

//     if (show._links.nextepisode) {
//       const nextRes = await axios.get(show._links.nextepisode.href);
//       nextEpisode = nextRes.data;
//     }

//     const newShow = new Show({
//       tvmazeId: show.id,
//       name: show.name,
//       poster: show.image?.medium || null,
//       lastEpisode: prevEpisode?.name || null,
//       lastAirDate: prevEpisode?.airdate || null,
//       nextEpisode: nextEpisode?.name || null,
//       nextAirDate: nextEpisode?.airdate || null,
//       userId: req.userId,
//     });

//     await newShow.save();

//     res.json(newShow);
//   } catch (error) {
//     console.error("ADD SHOW ERROR:", error.response?.data || error.message);

//     res.status(500).json({ message: "Failed to add show" });
//   }
// });

app.post("/add-show", authMiddleware, async (req, res) => {
  const { tvmazeId } = req.body;

  console.log("ADD SHOW REQUEST:", tvmazeId);

  if (!tvmazeId) {
    return res.status(400).json({ message: "tvmazeId missing" });
  }

  try {
    const showRes = await axios.get(`https://api.tvmaze.com/shows/${tvmazeId}`);

    const show = showRes.data;

    console.log("TVMAZE SHOW:", show.name);

    const existing = await Show.findOne({
      tvmazeId: show.id,
      userId: req.userId,
    });

    if (existing) {
      return res.json({ message: "Show already added" });
    }

    let prevEpisode = null;
    let nextEpisode = null;

    try {
      if (show._links?.previousepisode?.href) {
        const prevRes = await axios.get(show._links.previousepisode.href);
        prevEpisode = prevRes.data;
      }
    } catch (e) {
      console.log("Prev episode fetch failed");
    }

    try {
      if (show._links?.nextepisode?.href) {
        const nextRes = await axios.get(show._links.nextepisode.href);
        nextEpisode = nextRes.data;
      }
    } catch (e) {
      console.log("Next episode fetch failed");
    }

    const newShow = new Show({
      tvmazeId: show.id,
      name: show.name,
      poster: show.image?.medium || null,
      lastEpisode: prevEpisode?.name || null,
      lastAirDate: prevEpisode?.airdate || null,
      nextEpisode: nextEpisode?.name || null,
      nextAirDate: nextEpisode?.airdate || null,
      userId: req.userId,
    });

    await newShow.save();

    res.json(newShow);
  } catch (error) {
    console.error("ADD SHOW ERROR FULL:", error);

    res.status(500).json({
      message: "Failed to add show",
      error: error.message,
    });
  }
});

/* ---------------- GET USER SHOWS ---------------- */

app.get("/shows", authMiddleware, async (req, res) => {
  const shows = await Show.aggregate([
    {
      $match: {
        userId: req.userId,
      },
    },
    {
      $addFields: {
        hasNextEpisode: {
          $cond: [{ $ifNull: ["$nextAirDate", false] }, 1, 0],
        },
      },
    },
    {
      $sort: {
        hasNextEpisode: -1,
        nextAirDate: 1,
      },
    },
  ]);

  console.log("USER ID:", req.userId);
  console.log("SHOWS:", shows);
  res.json(shows);
});

/* ---------------- REFRESH ALL ---------------- */

app.get("/refresh-shows", authMiddleware, async (req, res) => {
  try {
    const shows = await Show.find({ userId: req.userId });

    for (const showDoc of shows) {
      const showRes = await axios.get(
        `https://api.tvmaze.com/shows/${showDoc.tvmazeId}`,
      );

      const show = showRes.data;

      let prevEpisode = null;
      let nextEpisode = null;

      if (show._links.previousepisode) {
        const prevRes = await axios.get(show._links.previousepisode.href);
        prevEpisode = prevRes.data;
      }

      if (show._links.nextepisode) {
        const nextRes = await axios.get(show._links.nextepisode.href);
        nextEpisode = nextRes.data;
      }

      await Show.updateOne(
        { _id: showDoc._id },
        {
          lastEpisode: prevEpisode?.name || null,
          lastAirDate: prevEpisode?.airdate || null,
          nextEpisode: nextEpisode?.name || null,
          nextAirDate: nextEpisode?.airdate || null,
        },
      );
    }

    res.json({ message: "Shows updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to refresh shows" });
  }
});

/* ---------------- REFRESH ONE ---------------- */

app.patch("/refresh-show/:id", authMiddleware, async (req, res) => {
  try {
    const showDoc = await Show.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!showDoc) {
      return res.status(404).json({ message: "Show not found" });
    }

    const showRes = await axios.get(
      `https://api.tvmaze.com/shows/${showDoc.tvmazeId}`,
    );

    const show = showRes.data;

    let prevEpisode = null;
    let nextEpisode = null;

    if (show._links.previousepisode) {
      const prevRes = await axios.get(show._links.previousepisode.href);
      prevEpisode = prevRes.data;
    }

    if (show._links.nextepisode) {
      const nextRes = await axios.get(show._links.nextepisode.href);
      nextEpisode = nextRes.data;
    }

    showDoc.lastEpisode = prevEpisode?.name || null;
    showDoc.lastAirDate = prevEpisode?.airdate || null;
    showDoc.nextEpisode = nextEpisode?.name || null;
    showDoc.nextAirDate = nextEpisode?.airdate || null;

    await showDoc.save();

    res.json(showDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to refresh show" });
  }
});

/* ---------------- DELETE ---------------- */

app.delete("/show/:id", authMiddleware, async (req, res) => {
  try {
    const deletedShow = await Show.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedShow) {
      return res.status(404).json({ message: "Show not found" });
    }

    res.json({ message: "Show deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting show" });
  }
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
