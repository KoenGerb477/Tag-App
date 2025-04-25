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
        const gamePin = await getUserGamePin(user.uid);
        setPin(gamePin);

        const userStatus = await getUserStatus(user.uid);
        setUserStatus(userStatus);
      };

      fetchUserData();
    }
  }, [user, router]);

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
    try {
      await signOut(auth);
      console.log("User logged out successfully");
      router.push("/"); // Redirect to the home page after logging out
    } catch (error) {
      console.error("Error logging out: ", error);
    }
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
    console.log(players[index].name);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 py-6 px-6 text-white">
      {userStatus == "it" && (
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
                      {players[index].timesCaught}
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
      {
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      }
    </div>
  );
}
