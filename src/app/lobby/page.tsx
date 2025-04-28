"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { startGame } from "../utils/startGame";
import { leaveGame } from "../utils/leaveGame";

interface Player {
  id: string;
  name: string;
  status: string;
}

async function getPlayers(gamePin: string): Promise<Player[]> {
  const playersRef = collection(db, "games", gamePin, "players");
  const querySnapshot = await getDocs(playersRef);
  const playersData: Player[] = [];

  querySnapshot.forEach((doc) => {
    playersData.push(doc.data() as Player);
  });

  return playersData;
}

export default function Lobby() {
  const [user] = useAuthState(auth);
  const [pin, setPin] = useState(""); // Store the user's game pin
  const [username, setUsername] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const router = useRouter();
  const [startToggler, setStartToggler] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    const fetchPlayers = async () => {
      if (pin) {
        const playersData = await getPlayers(pin);
        setPlayers(playersData); // Set the players data to the state
      }
    };
    fetchPlayers();
  }, [pin]);

  useEffect(() => {
    if (!user) {
      router.push("/"); // Redirect to sign-in if not logged in
    } else {
      // Fetch the user's name and game status (including pin)
      const fetchUserData = async () => {
        const userName = await getUserName(user.uid);
        setUsername(userName);

        const gamePin = await getUserGamePin(user.uid);
        setPin(gamePin);
      };
      fetchUserData();
    }
  }, [user, router]);

  // Fetch the user's name from Firestore
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

  // Fetch the user's game pin from Firestore
  async function getUserGamePin(userId: string) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.gamePin; // Return the pin if the user is in a game
    }
    return null; // Return null if no game is found
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully");
      router.push("/"); // Redirect to the home page after logging out
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartToggler(!startToggler);
  };

  const handlePlayerClick = async (index: number) => {
    if (startToggler) {
      const confirmed = window.confirm(
        `Are you sure you want to start the game with ${players[index].name} it?`
      );

      if (confirmed && startDate && endDate) {
        startGame(players, pin, index, startDate, endDate);
        if (user) {
          await setUserGameStatus(user.uid, pin);
        }
        router.push("/game");
      }
    }
  };

  // Set user game status in Firestore
  async function setUserGameStatus(userID: string, pin: string) {
    const userRef = doc(db, "users", userID);
    if (user) {
      await updateDoc(userRef, {
        inGame: true,
        gamePin: pin,
      });
    }
  }

  const handleLeave = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to leave this game? You will not be able to rejoin.`
    );

    if (user && confirmed) {
      leaveGame(pin, user?.uid);
      router.push("/join");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 py-6 px-6 text-white">
      <h1 className="text-4xl font-extrabold mb-4">
        Welcome, {username || "User"}
      </h1>

      <h1 className="text-2xl font-bold mb-4">Your game pin is {pin}</h1>

      {startToggler && (
        <h1 className="text-xl font-semibold text-center mt-6 text-orange-500">
          SELECT A PLAYER TO START IT
        </h1>
      )}

      <div className="bg-gray-700 p-6 rounded-xl shadow-lg w-full max-w-lg text-center mt-6">
        <h2 className="text-2xl font-semibold mb-4">Players in the Game</h2>
        <ul>
          {players.length > 0 ? (
            players.map((player, index) => (
              <li
                key={index}
                className="text-lg mb-2 cursor-pointer hover:text-orange-400"
                onClick={() => handlePlayerClick(index)}
              >
                {player.name}
              </li>
            ))
          ) : (
            <p>No players yet.</p>
          )}
        </ul>
      </div>
      <form
        onSubmit={handleStartGame}
        className="w-full max-w-md bg-gray-700 p-8 rounded-xl shadow-lg mt-8"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Set Game Start and End Time
        </h2>

        <label className="block text-sm font-medium mb-2 text-gray-300">
          Start Date and Time
        </label>
        <input
          type="datetime-local"
          required
          onChange={(e) => setStartDate(new Date(e.target.value))}
          className="w-full p-4 mb-6 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <label className="block text-sm font-medium mb-2 text-gray-300">
          End Date and Time
        </label>
        <input
          type="datetime-local"
          required
          onChange={(e) => setEndDate(new Date(e.target.value))}
          className="w-full p-4 mb-6 rounded-md bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <button
          type="submit"
          className="w-full p-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors"
        >
          START GAME
        </button>
      </form>
      <button
        onClick={handleLeave}
        className="mt-6 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
      >
        Leave Game
      </button>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
