"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebase"; // Firebase Auth instance
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth"; // For email/password authentication
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase/firebase"; // Firestore instance

export default function HomePage() {
  const [user] = useAuthState(auth);
  const [email, setEmail] = useState(""); // Store email
  const [password, setPassword] = useState(""); // Store password
  const [username, setUsername] = useState(""); // Store username (only for sign up)
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign Up and Sign In modes
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Check if the user is already part of a game
      const checkUserGameStatus = async () => {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.inGame) {
            router.push(`/game`); // Redirect to the game page if the user is already in a game
          } else {
            router.push("/join"); // Otherwise, redirect to the join page
          }
        }
      };
      checkUserGameStatus();
    }
  }, [user, router]);

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: username,
        email: email,
        inGame: false,
        status: "not it",
        timesCaught: 0,
        timeCaught: 0,
        timeIt: 0,
        gamePin: "",
      });
      router.push("/join"); // Redirect to join page after successful sign up
    } catch (error) {}
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password); // Log in user with email and password
    } catch (error) {}
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 py-6 px-6 text-white">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-orange-500">
        Welcome to Tag!
      </h1>

      <div className="bg-gray-700 p-8 rounded-xl shadow-lg w-full max-w-sm text-center mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 w-full rounded-md mb-4"
          placeholder="Enter your email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 w-full rounded-md mb-4"
          placeholder="Enter your password"
        />
        {isSignUp && (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-4 py-2 w-full rounded-md mb-4"
            placeholder="Enter your name"
          />
        )}

        <button
          onClick={isSignUp ? handleSignUp : handleSignIn}
          className="bg-blue-500 p-2 rounded-md text-white w-full mb-4"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)} // Toggle between Sign Up and Sign In modes
          className="bg-green-500 p-2 rounded-md text-white w-full"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
