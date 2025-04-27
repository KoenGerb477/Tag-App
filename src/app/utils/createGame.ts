import { db } from "../firebase/firebase"; // your Firestore export
import {  doc, setDoc, getDoc } from "firebase/firestore";

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createGame() {
  let pin = "";
  let docExists = true;

  // Ensure the PIN doesn't already exist
  while (docExists) {
    pin = generatePin();
    const docRef = doc(db, "games", pin);
    const docSnap = await getDoc(docRef);
    docExists = docSnap.exists();
  }

  const gameRef = doc(db, "games", pin);

  await setDoc(gameRef, {
    createdAt: new Date(),
    isActive: false,
    startDate: new Date(),
    endDate: new Date(),
  });

  return pin;
}
