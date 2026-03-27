import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- MONGODB CONNECTION ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ---------------- SCHEMA ---------------- */

const showSchema = new mongoose.Schema({
  tvmazeId: { type: Number, unique: true },
  name: String,
  poster: String,
  lastEpisode: String,
  lastAirDate: Date,
  nextEpisode: String,
  nextAirDate: Date,
});

const Show = mongoose.model("Show", showSchema);

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.send("TV Tracker API running");
});

/* ---------------- SEARCH SHOW (GLOBAL DATABASE) ---------------- */

app.get("/search/:name", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.tvmaze.com/search/shows?q=${req.params.name}`,
    );

    const results = response.data;

    const formatted = await Promise.all(
      results.slice(0, 8).map(async (item) => {
        const show = item.show;

        const existing = await Show.findOne({ tvmazeId: show.id });

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

/* ---------------- ADD SHOW ---------------- */

app.post("/add-show", async (req, res) => {
  const { name } = req.body;

  try {
    const showRes = await axios.get(
      `https://api.tvmaze.com/singlesearch/shows?q=${name}`,
    );

    const show = showRes.data;

    /* Prevent duplicates */
    const existing = await Show.findOne({ tvmazeId: show.id });

    if (existing) {
      return res.json({ message: "Show already added" });
    }

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

    const newShow = new Show({
      tvmazeId: show.id,
      name: show.name,
      poster: show.image?.medium || null,
      lastEpisode: prevEpisode?.name || null,
      lastAirDate: prevEpisode?.airdate || null,
      nextEpisode: nextEpisode?.name || null,
      nextAirDate: nextEpisode?.airdate || null,
    });

    await newShow.save();

    res.json(newShow);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error adding show" });
  }
});

/* ---------------- GET TRACKED SHOWS ---------------- */

app.get("/shows", async (req, res) => {
  const shows = await Show.aggregate([
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

  res.json(shows);
});

/* ---------------- REFRESH ALL SHOWS ---------------- */

app.get("/refresh-shows", async (req, res) => {
  try {
    const shows = await Show.find();

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
        { tvmazeId: showDoc.tvmazeId },
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

/* ---------------- REFRESH SINGLE SHOW ---------------- */

app.patch("/refresh-show/:id", async (req, res) => {
  try {
    const showDoc = await Show.findById(req.params.id);

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

/* ---------------- DELETE SHOW ---------------- */

app.delete("/show/:id", async (req, res) => {
  try {
    const deletedShow = await Show.findByIdAndDelete(req.params.id);

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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
