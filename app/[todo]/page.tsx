"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  AppBar,
  Toolbar,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Delete, Add, ExitToApp, DragIndicator } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore } from "../../lib/FirebaseConfig";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import type { User } from "firebase/auth";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
  userId: string;
  priority: number;
}

const authTyped = auth as Auth;
const firestoreTyped = firestore as Firestore;

export default function TodoPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authTyped, (user) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        router.push("/");
      } else if (user.uid !== String(params.todo)) {
        router.push(`/${user.uid}`);
      }
    });
    return () => unsubscribe();
  }, [router, params.todo]);

  useEffect(() => {
    if (user && user.uid === String(params.todo)) {
      const q = query(
        collection(firestoreTyped, "todos"),
        where("userId", "==", user.uid),
        orderBy("priority", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const todosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Todo[];
        setTodos(todosData);
      });
      return () => unsubscribe();
    }
  }, [user, params.todo]);

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user) return;
    try {
      const maxPriority = todos.length > 0 ? Math.max(...todos.map(t => t.priority ?? 0)) : 0;
      await addDoc(collection(firestoreTyped, "todos"), {
        text: newTodo,
        completed: false,
        createdAt: new Date(),
        userId: user.uid,
        priority: maxPriority + 1
      });
      setNewTodo("");
      setError("");
    } catch (error) {
      console.error("Todo追加エラー:", error);
      setError("Todoの追加に失敗しました。");
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(firestoreTyped, "todos", id), {
        completed: !completed
      });
    } catch (error) {
      console.error("Todo更新エラー:", error);
      setError("Todoの更新に失敗しました。");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(firestoreTyped, "todos", id));
    } catch (error) {
      console.error("Todo削除エラー:", error);
      setError("Todoの削除に失敗しました。");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(authTyped);
      router.push("/");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      setError("ログアウトに失敗しました。");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(todos);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    try {
      await Promise.all(
        reordered.map((todo, idx) => {
          if (todo.priority !== idx + 1) {
            return updateDoc(doc(firestoreTyped, "todos", todo.id), { priority: idx + 1 });
          }
          return Promise.resolve();
        })
      );
    } catch (error) {
      setError("並び替えに失敗しました。");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.displayName ?? "ユーザー"}'s Todo
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create New Todo
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Please enter a new todo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            />
            <Button
              variant="contained"
              onClick={handleAddTodo}
              disabled={!newTodo.trim()}
              startIcon={<Add />}
              sx={{ minWidth: 120 }}
            >
              Add
            </Button>
          </Box>
        </Paper>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Todo List ({todos.length})
          </Typography>
          {todos.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              No todos available. Please add a new todo.
            </Typography>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="todo-list">
                {(provided) => (
                  <List ref={provided.innerRef} {...provided.droppableProps}>
                    {todos.map((todo, idx) => (
                      <Draggable key={todo.id} draggableId={todo.id} index={idx}>
                        {(provided, snapshot) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            divider
                            sx={{ background: snapshot.isDragging ? '#f0f0f0' : 'inherit', display: 'flex', alignItems: 'center' }}
                          >
                            {/* ハンバーガーアイコン（ドラッグハンドル） */}
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'grab',
                                mr: 1,
                                color: snapshot.isDragging ? 'primary.main' : 'action.active',
                              }}
                            >
                              <DragIndicator />
                            </Box>
                            <Checkbox
                              checked={todo.completed}
                              onChange={() => handleToggleTodo(todo.id, todo.completed)}
                              sx={{ mr: 1 }}
                            />
                            <ListItemText
                              primary={todo.text}
                              sx={{
                                textDecoration: todo.completed ? "line-through" : "none",
                                opacity: todo.completed ? 0.6 : 1,
                              }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleDeleteTodo(todo.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
