"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { leaveGame } from "../utils/leaveGame";

interface Player {
  id: string;
  name: string;
  status: string;
  timeIt: number;
  timeCaught: Timestamp;
  timesCaught: number;
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

export default function Game() {
  const [user] = useAuthState(auth);
  const [pin, setPin] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const router = useRouter();
  const [openPlayerIndex, setOpenPlayerIndex] = useState<number | null>(null);
  const [tagToggler, setTagToggler] = useState(false);
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
      router.push("/");
    } else {
      const fetchUserData = async () => {
        const gamePin = await getUserGamePin(user.uid);
        setPin(gamePin);

        const userStatus = await getUserStatus(user.uid);
        setUserStatus(userStatus);
      };

      fetchUserData();
    }
  }, [user, router]);

  useEffect(() => {
    const getDateData = async () => {
      if (!pin) return;

      const gameRef = doc(db, "games", pin);
      const gameDoc = await getDoc(gameRef);
      if (gameDoc.exists()) {
        const startDate = gameDoc.data().startDate.toDate();
        const endDate = gameDoc.data().endDate.toDate();

        setStartDate(startDate);
        setEndDate(endDate);
      }
    };

    getDateData();
  }, [pin]);

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

  // Fetch the user's game pin from Firestore
  async function getUserStatus(userId: string) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.status; // Return the pin if the user is in a game
    }
    return null; // Return null if no game is found
  }

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/"); // Redirect to the home page after logging out
  };

  const handlePlayerClick = (index: number) => {
    if (!tagToggler) {
      toggleStats(index);
    } else {
      if (players[index].id == user?.uid) {
        window.alert("You can't tag yourself!");
      } else {
        const confirmed = window.confirm(
          `Are you sure you want to tag ${players[index].name}?`
        );
        if (user?.uid) {
          if (confirmed) {
            doTag(user?.uid, players[index].id);
          }
        }
      }
    }
  };

  const toggleStats = (index: number) => {
    setOpenPlayerIndex(openPlayerIndex === index ? null : index);
  };

  const handleTag = async () => {
    setTagToggler(!tagToggler);
  };

  const doTag = async (userId: string, taggedPersonId: string) => {
    const usersRef = doc(db, "users", userId);
    const playersRef = doc(db, `/games/${pin}/players`, userId);
    const userDoc = await getDoc(usersRef);

    if (userDoc.exists()) {
      const timeCaught = userDoc.data().timeCaught.toDate();
      const timeIt = userDoc.data().timeIt;

      const currentTime = new Date();
      const timeElapsed = currentTime.getTime() - timeCaught.getTime();

      const totalTimeIt = timeIt + timeElapsed;

      await updateDoc(usersRef, {
        status: "not it",
        timeIt: totalTimeIt,
      });

      await updateDoc(playersRef, {
        status: "not it",
        timeIt: totalTimeIt,
      });
    }

    const taggedRef = doc(db, "users", taggedPersonId);
    const taggedPlayerRef = doc(db, `/games/${pin}/players`, taggedPersonId);

    const taggedDoc = await getDoc(taggedRef);

    if (taggedDoc.exists()) {
      const timesCaught = taggedDoc.data().timesCaught;
      const totalTimesCaught = timesCaught + 1;

      await updateDoc(taggedRef, {
        status: "it",
        timeCaught: new Date(),
        timesCaught: totalTimesCaught,
      });

      await updateDoc(taggedPlayerRef, {
        status: "it",
        timeCaught: new Date(),
        timesCaught: totalTimesCaught,
      });
    }

    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === userId
          ? { ...player, status: "not it" }
          : player.id === taggedPersonId
          ? { ...player, status: "it" }
          : player
      )
    );

    if (user?.uid === userId) {
      setUserStatus("not it");
    } else if (user?.uid === taggedPersonId) {
      setUserStatus("it");
    }

    setTagToggler(false);
  };

  const getTimeIt = (index: number) => {
    if (players[index].status == "it") {
      const currentTime = new Date();

      const totalTimeIt =
        players[index].timeIt +
        currentTime.getTime() -
        players[index].timeCaught.toDate().getTime();

      const totalSeconds = Math.floor(totalTimeIt / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      const totalSeconds = Math.floor(players[index].timeIt / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
  };

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
    <>
      {(!startDate || !endDate) && (
        <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white text-2xl">
          Loading...
        </div>
      )}

      {startDate && endDate && (
        <>
          {startDate > new Date() && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white text-2xl">
              <div className="text-center">
                Game will begin at{" "}
                {startDate
                  ? new Date(startDate).toLocaleString()
                  : "Loading..."}
              </div>
              <button
                onClick={handleLogout}
                className="mt-6 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          )}

          {startDate <= new Date() && new Date() <= endDate && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 py-6 px-6 text-white">
              {userStatus === "it" && (
                <button
                  onClick={handleTag}
                  className="mt-6 mb-8 text-xl font-bold bg-red-500 text-white py-4 px-6 rounded-2xl hover:bg-red-600 shadow-lg transition-all duration-200"
                >
                  🔔 Tag Someone
                </button>
              )}

              {tagToggler && (
                <h1 className="text-2xl font-bold text-center mt-4 text-orange-500">
                  SELECT A PLAYER TO TAG
                </h1>
              )}

              <div className="bg-gray-700 p-8 rounded-xl shadow-lg w-full max-w-2xl text-center mb-6">
                <h2 className="text-2xl mb-4">Players in the Game</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {players.length > 0 ? (
                    players.map((player, index) => (
                      <div
                        key={index}
                        className={`rounded-xl px-4 py-3 text-lg font-semibold cursor-pointer transition duration-200 ${
                          player.status === "it"
                            ? "bg-red-500 text-white"
                            : player.id === user?.uid
                            ? "bg-green-500 text-white"
                            : "bg-white text-black"
                        }`}
                        onClick={() => handlePlayerClick(index)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {player.name} {player.status === "it" && "🔥"}
                        </div>
                        {openPlayerIndex === index && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-100 rounded-md p-2">
                            <p>
                              <strong>Time It:</strong> {getTimeIt(index)}
                            </p>
                            <p>
                              <strong>Times Caught:</strong>{" "}
                              {player.timesCaught}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-white">No players yet.</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-6 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          )}

          {new Date() > endDate && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white text-2xl">
              <div>Game is over</div>
              <div className="w-full max-w-lg mx-auto bg-gray-700 p-6 rounded-xl shadow-lg">
                {players.length > 0 ? (
                  players.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between mb-4 p-4 bg-gray-600 rounded-md hover:bg-gray-500 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {player.name}
                        </span>
                        {player.status === "it" && (
                          <span className="text-red-500 font-bold">🔥</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300">
                        <div>Time It: {getTimeIt(index)}</div>
                        <div>Times Caught: {player.timesCaught}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-white">No players yet.</p>
                )}
              </div>
              <button
                onClick={handleLeave}
                className="mt-6 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
              >
                Leave Game
              </button>
              <button
                onClick={handleLogout}
                className="mt-6 bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
