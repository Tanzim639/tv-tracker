import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "./api";

import SearchBar from "./components/SearchBar";
import ShowList from "./components/ShowList";
import ShowDetails from "./components/ShowDetails";
import Login from "./pages/Login";

function App() {
  const [shows, setShows] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchShows = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;

    try {
      console.log("FETCHING SHOWS...");
      setLoading(true);

      const res = await API.get("/shows");

      console.log("SHOWS:", res.data);

      setShows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("FETCH ERROR:", err);

      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: run ONCE on load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);
      fetchShows();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShows([]);
  };

  return (
    <BrowserRouter>
      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <div className="p-4 flex justify-between items-center bg-gray-900">
            <h1 className="text-white font-bold text-xl">TV Tracker</h1>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SearchBar onAdd={fetchShows} />

                  {loading ? (
                    <p className="text-gray-400 p-4">Loading shows...</p>
                  ) : shows.length === 0 ? (
                    <p className="text-gray-400 p-4">
                      No shows yet. Search and add one.
                    </p>
                  ) : (
                    <ShowList shows={shows} refresh={fetchShows} />
                  )}
                </>
              }
            />

            <Route path="/show/:id" element={<ShowDetails />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
}

export default App;
