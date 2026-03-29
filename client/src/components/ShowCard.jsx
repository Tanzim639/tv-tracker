import { useState } from "react";
import API from "../api"; // 🔥 use API instead of axios
import { useNavigate } from "react-router-dom";

function ShowCard({ show, refresh }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const deleteShow = async () => {
    try {
      await API.delete(`/show/${show._id}`); // ✅ token auto-added
      setShowConfirm(false);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-xs hover:scale-105 hover:shadow-2xl transition-transform duration-200 flex flex-col relative">
        {show.poster && (
          <div className="relative w-full h-64 bg-gray-900">
            <img
              src={show.poster}
              alt={show.name}
              className="w-full h-full object-contain"
            />

            <button
              onClick={() => setShowConfirm(true)}
              className="absolute bottom-2 right-2 bg-black/70 hover:bg-red-600 text-white p-2 rounded-full transition"
            >
              🗑️
            </button>
          </div>
        )}

        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{show.name}</h3>

            <p className="text-gray-300 text-sm">
              <span className="font-semibold">Last:</span>{" "}
              {show.lastEpisode || "N/A"}
            </p>

            {show.lastAirDate && (
              <p className="text-gray-400 text-xs">
                {show.lastAirDate.slice(0, 10)}
              </p>
            )}

            <p className="text-gray-300 text-sm mt-2">
              <span className="font-semibold">Next:</span>{" "}
              {show.nextEpisode || "None"}
            </p>

            {show.nextAirDate && (
              <p className="text-gray-400 text-xs">
                {show.nextAirDate.slice(0, 10)}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(`/show/${show._id}`)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition"
          >
            Details
          </button>
        </div>
      </div>

      {/* 🔥 Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-80 text-center">
            <h2 className="text-lg font-bold text-white mb-3">
              Delete "{show.name}"?
            </h2>

            <p className="text-gray-400 mb-5 text-sm">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
              >
                Cancel
              </button>

              <button
                onClick={deleteShow}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShowCard;
