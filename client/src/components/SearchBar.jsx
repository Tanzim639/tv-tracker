import { useState, useEffect } from "react";
import API from "../api"; // 🔥 use custom API

function SearchBar({ onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await API.get(`/search/${query}`); // ✅ token auto-added

        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const addShow = async (tvmazeId, name) => {
    try {
      await API.post("/add-show", { name }); // ✅ token auto-added

      // 🔥 update UI instantly
      setResults((prev) =>
        prev.map((show) =>
          show.tvmazeId === tvmazeId ? { ...show, alreadyAdded: true } : show,
        ),
      );

      onAdd();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Input */}
      <input
        type="text"
        placeholder="🔍 Search shows..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Dropdown */}
      {(query || loading) && (
        <div className="absolute top-full left-0 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {loading && <p className="p-3 text-gray-400">Searching...</p>}

          {!loading && results.length === 0 && (
            <p className="p-3 text-gray-400">No results</p>
          )}

          {!loading &&
            results.map((show) => (
              <div
                key={show.tvmazeId}
                className="flex items-center gap-3 p-3 hover:bg-gray-800 transition"
              >
                {show.poster && (
                  <img
                    src={show.poster}
                    alt={show.showName}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <p className="text-white font-medium">{show.showName}</p>
                </div>

                <button
                  onClick={() => addShow(show.tvmazeId, show.showName)}
                  disabled={show.alreadyAdded}
                  className={`px-3 py-1 rounded text-sm ${
                    show.alreadyAdded
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {show.alreadyAdded ? "Added" : "Add"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
