import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/login", { username, password });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token); // 🔥 important

      navigate("/");
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleSignup = async () => {
    try {
      await API.post("/signup", { username, password });
      alert("User created! Now login.");
    } catch (err) {
      console.error(err); // 🔥 logs full error
      alert(err.response?.data?.message || "Signup failed"); // 🔥 show actual backend message
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">TV Tracker</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-4 py-2 rounded bg-gray-800 w-64"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-2 rounded bg-gray-800 w-64"
      />

      <div className="flex gap-3">
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Login
        </button>

        <button
          onClick={handleSignup}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Signup
        </button>
      </div>
    </div>
  );
}

export default Login;
