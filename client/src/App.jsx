import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "./api";

import SearchBar from "./components/SearchBar";
import ShowList from "./components/ShowList";
import ShowDetails from "./components/ShowDetails";
import Login from "./pages/Login";

function App() {
  const [shows, setShows] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Fetch all user's shows
  const fetchShows = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await API.get("/shows");
      setShows(res.data);
    } catch (err) {
      console.error(err);
      // If token expired or invalid, logout automatically
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, [token]); // refetch whenever login/logout

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShows([]);
  };

  // Protect app routes
  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <BrowserRouter>
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
              ) : (
                <ShowList shows={shows} refresh={fetchShows} />
              )}
            </>
          }
        />

        <Route path="/show/:id" element={<ShowDetails />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
