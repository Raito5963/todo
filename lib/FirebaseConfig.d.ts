import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

declare const auth: Auth;
declare const firestore: Firestore;
export { auth, firestore };
