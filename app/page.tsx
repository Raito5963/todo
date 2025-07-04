
"use client";

import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material"
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/FirebaseConfig";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // ユーザーがログインしている場合、そのユーザーのTodoページにリダイレクト
        router.push(`/${user.uid}`);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // ログイン成功後、ユーザーのTodoページにリダイレクト
      router.push(`/${user.uid}`);
    } catch (error) {
      console.error("ログインエラー:", error);
      setError("ログインに失敗しました。もう一度お試しください。");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "primary.main" }}>
          Todo App
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Please sign in with Google to manage your todos.
        </Typography>
        
        {error !== null && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          size="large"
          onClick={handleGoogleSignIn}
          sx={{ 
            mt: 2,
            py: 1.5,
            px: 4,
            fontSize: "1.1rem",
            background: "linear-gradient(45deg, #4285f4, #34a853)",
            "&:hover": {
              background: "linear-gradient(45deg, #357ae8, #2e8b47)",
            }
          }}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  );
}
