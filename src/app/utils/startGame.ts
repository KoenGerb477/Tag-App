import { db } from "../firebase/firebase"; // your Firestore export
import { collection, doc, updateDoc } from "firebase/firestore";


interface Player {
    id: string;
    name: string;
    status: string;
  }
  
export async function startGame(players: Player[], pin: string, itIndex: number, startDate: Date, endDate: Date) {
    const gameRef = doc(db, "games", pin);

    console.log(startDate, endDate)
    await updateDoc(gameRef, {
        isActive: true,
        currentIt: players[itIndex].id,
        startDate: startDate,
        endDate: endDate
    });

  const playerRef = doc(collection(gameRef, "players"), players[itIndex].id);

  await updateDoc(playerRef, {
    status: "it",
    timesCaught: 0,
    timeCaught: startDate,
    timeIt: 0,
  });

  const usersRef = doc(db, "users", players[itIndex].id);

  await updateDoc(usersRef, {
    status: "it",
    timeCaught: startDate
  });
}
