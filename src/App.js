import React, { useState, useEffect } from "react";
import Auth from "./components/Authentication/Auth";
import EventSpace from "./components/EventSpace/EventSpace";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);

  // Keep track of logged-in user automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      {user ? (
        <EventSpace user={user} /> // main app component
      ) : (
        <Auth setUser={setUser} /> // login/signup
      )}
    </div>
  );
}

export default App;
