import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: { 
    apiKey: string; 
    authDomain: string; 
    projectId: string; 
    storageBucket: string; 
    messagingSenderId: string; 
    appId: string; 
    measurementId: string; 
} = {
    apiKey: process.env.NEXT_PUBLIC_APIKEY as string,
    authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN as string,
    projectId: process.env.NEXT_PUBLIC_PROJECTID as string,
    storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET as string,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID as string,
    appId: process.env.NEXT_PUBLIC_APPID as string,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENTID as string
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
