import { db } from "../firebase/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

export async function leaveGame(pin: string, userId: string) {
    await updateDoc(doc(db, "users", userId), {
        inGame: false,
        status: "not it",
        timesCaught: 0,
        timeCaught: 0,
        timeIt: 0,
        gamePin: "",
      });

    const playerRef = doc(db, "games", pin, "players", userId)
    await deleteDoc(playerRef)
}
