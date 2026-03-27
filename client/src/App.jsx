import { useEffect, useState } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import ShowList from "./components/ShowList";
import ShowDetails from "./components/ShowDetails"; // ✅ Details page
import { Routes, Route } from "react-router-dom";

function App() {
  const [shows, setShows] = useState([]);

  const loadShows = async () => {
    try {
      const res = await axios.get("https://tv-tracker-muie.onrender.com/shows");
      setShows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadShows();
    // Refresh all shows once on app load
    axios
      .get("https://tv-tracker-muie.onrender.com/refresh-shows")
      .then(loadShows);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="text-center py-10 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg">
        <h1 className="text-5xl font-extrabold mb-2">TV Series Tracker</h1>
        <p className="text-gray-300 text-lg">
          Keep track of your favorite shows
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-10">
        <Routes>
          {/* Home page */}
          <Route
            path="/"
            element={
              <>
                {/* Search */}
                <div className="mb-10">
                  <SearchBar onAdd={loadShows} />
                </div>

                {/* Show Grid */}
                <ShowList shows={shows} refresh={loadShows} />
              </>
            }
          />

          {/* Show Details page */}
          <Route path="/show/:id" element={<ShowDetails />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-6 mt-16 border-t border-gray-700">
        &copy; 2026 TV Tracker
      </footer>
    </div>
  );
}

export default App;
