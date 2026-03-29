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

  const fetchShows = async () => {
    try {
      const res = await API.get("/shows");
      setShows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShows();
    }
  }, [token]); // ✅ reacts to login/logout

  // 🔥 logout function
  const logout = () => {
    localStorage.removeItem("token");
    setShows([]); // 🔥 clear UI
    setToken(null);
  };

  // 🔒 protect app
  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <BrowserRouter>
      <div className="p-4 flex justify-between items-center">
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
              <ShowList shows={shows} refresh={fetchShows} />
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
