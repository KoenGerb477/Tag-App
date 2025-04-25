"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { createGame } from "../utils/createGame";
import { joinGame } from "../utils/joinGame";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function Home() {
  const [user] = useAuthState(auth);
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [inGameStatus, setInGameStatus] = useState(false); // Changed to boolean for easier control
  const router = useRouter();

  // Redirect to sign-in page if no user is logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      const fetchUserName = async () => {
        const userName = await getUserName(user.uid);
        setUsername(userName);
      };
      fetchUserName();

      const fetchInGameStatus = async () => {
        const inGameStatus = await getInGameStatus(user.uid);
        setInGameStatus(inGameStatus);
      };
      fetchInGameStatus();
    }
  }, [user, router]);

  // Fetch user name from Firestore
  async function getUserName(userId: string) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().name;
    } else {
      console.log("No such document!");
      return "";
    }
  }

  // Fetch user's in-game status from Firestore
  async function getInGameStatus(userId: string) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().inGame;
    } else {
      console.log("No such document!");
      return false;
    }
  }

  // Handle creating a new game
  const handleCreateGame = async () => {
    try {
      if (user) {
        const newPin = await createGame();

        // Automatically join the newly created game
        await joinGame(newPin, user.uid, username);

        // Redirect to the game page
        router.push(`/lobby`);
      }
    } catch (error) {
      console.log("Error creating the game: ", error);
    }
  };

  // Handle joining an existing game
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await joinGame(pin, user.uid, username);
      router.push(`/lobby`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 py-6 px-6 text-white">
      {inGameStatus ? (
        <div className="game-screen bg-gray-700 p-8 rounded-xl shadow-lg w-full max-w-sm text-center mb-6">
          <h2 className="text-2xl font-bold mb-4">Game In Progress</h2>
          <p className="text-lg mb-4">
            You are currently in a game, {username}!
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-extrabold mb-6">
            Welcome, {username || "User"}
          </h1>

          <div className="bg-gray-700 p-8 rounded-xl shadow-lg w-full max-w-sm text-center mb-6">
            <button
              onClick={handleCreateGame}
              className="w-full p-4 bg-red-500 text-white rounded-md mb-4 hover:bg-red-600 transition-colors"
            >
              Create Game
            </button>

            <form onSubmit={handleJoinGame}>
              <input
                type="text"
                placeholder="Enter Game Pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-4 bg-gray-600 text-white placeholder-gray-400 rounded-md mb-4"
              />
              <button
                type="submit"
                className="w-full p-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Join Game
              </button>
            </form>
          </div>
        </>
      )}

      <div className="bg-gray-700 p-8 rounded-xl shadow-lg w-full max-w-sm text-center mt-6">
        <button
          onClick={() => signOut(auth)}
          className="w-full p-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
