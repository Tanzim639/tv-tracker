import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import axios from "axios";

function ShowDetails() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setLoading(true);

        // ✅ get user-specific show (secure)
        const res = await API.get(`/show/${id}`);
        const showDoc = res.data;
        setBackendData(showDoc);

        // ✅ get full info from TVMaze
        const tvmazeRes = await axios.get(
          `https://api.tvmaze.com/shows/${showDoc.tvmazeId}`,
        );

        setShow(tvmazeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShow();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!show) return <p className="text-center mt-10">Show not found</p>;

  const summary =
    show.summary?.replace(/<[^>]+>/g, "") || "No summary available";

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-xl shadow-lg text-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
      >
        ← Back
      </button>

      <h1 className="text-4xl font-bold mb-4">{show.name}</h1>

      {show.image && (
        <img
          src={show.image.medium}
          alt={show.name}
          className="w-full max-w-sm h-auto object-contain rounded mb-4 mx-auto"
        />
      )}

      <p className="text-gray-300 mb-4">{summary}</p>

      <div className="grid grid-cols-2 gap-4 text-gray-300 mb-4">
        {show.genres?.length > 0 && (
          <p>
            <span className="font-semibold">Genres:</span>{" "}
            {show.genres.join(", ")}
          </p>
        )}

        {show.runtime && (
          <p>
            <span className="font-semibold">Runtime:</span> {show.runtime} min
          </p>
        )}

        {show.officialSite && (
          <p>
            <span className="font-semibold">Official Site:</span>{" "}
            <a
              href={show.officialSite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Visit
            </a>
          </p>
        )}

        {show.externals?.imdb && (
          <p>
            <span className="font-semibold">IMDb:</span>{" "}
            <a
              href={`https://www.imdb.com/title/${show.externals.imdb}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              View
            </a>
          </p>
        )}
      </div>

      {/* 🔥 YOUR BACKEND DATA (user-specific) */}
      {backendData && (
        <div className="text-gray-300 space-y-2 border-t border-gray-700 pt-4">
          <p>
            <span className="font-semibold">Last Episode:</span>{" "}
            {backendData.lastEpisode || "N/A"}
          </p>

          {backendData.lastAirDate && (
            <p className="text-gray-400 text-sm">
              Airdate: {backendData.lastAirDate.slice(0, 10)}
            </p>
          )}

          <p>
            <span className="font-semibold">Next Episode:</span>{" "}
            {backendData.nextEpisode || "None"}
          </p>

          {backendData.nextAirDate && (
            <p className="text-gray-400 text-sm">
              Airdate: {backendData.nextAirDate.slice(0, 10)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ShowDetails;
