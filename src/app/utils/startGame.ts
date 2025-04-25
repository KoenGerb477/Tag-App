import { db } from "../firebase/firebase"; // your Firestore export
import { collection, doc, updateDoc } from "firebase/firestore";


interface Player {
    id: string;
    name: string;
    status: string;
  }
  
export async function startGame(players: Player[], pin: string, itIndex: number) {
    const gameRef = doc(db, "games", pin);

    await updateDoc(gameRef, {
        isActive: true,
        currentIt: players[itIndex].id,
    });

  const playerRef = doc(collection(gameRef, "players"), players[itIndex].id);

  await updateDoc(playerRef, {
    status: "it",
    timesCaught: 0,
    timeCaught: 0,
    timeIt: 0,
  });

  const usersRef = doc(db, "users", players[itIndex].id);

  await updateDoc(usersRef, {
    status: "it",
    timeCaught: new Date()
  });
}
