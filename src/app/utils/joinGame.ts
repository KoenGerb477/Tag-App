import { db } from "../firebase/firebase";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export async function joinGame(pin: string, userId: string, username: string) {
  const gameRef = doc(db, "games", pin);

  const gameDoc = await getDoc(gameRef);

  if (!gameDoc.exists()) {
    throw new Error("Game not found");
  }

  // Add player to the game's 'players' subcollection
  const playerRef = doc(collection(gameRef, "players"), userId);

  await setDoc(playerRef, {
    id: userId,
    name: username,
    status: "not it",
    timeIt: 0,
    timeCaught:0,
    timesCaught: 0
  });

  const usersRef = doc(db, "users", userId);

  await updateDoc(usersRef, {
    gamePin: pin,
    inGame: true
  });

  return `Joined game with pin: ${pin}`;
}
