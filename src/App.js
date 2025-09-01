import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./components/Authentication/Auth";
import EventSpace from "./components/EventSpace/EventSpace";
import EventDetail from "./components/EventSpace/EventDetail"; // new page
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

  if (!user) {
    return <Auth setUser={setUser} />; // login/signup
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Homepage = EventSpace */}
        <Route path="/" element={<EventSpace user={user} />} />

        {/* Dynamic route for individual event */}
        <Route path="/event/:id" element={<EventDetail user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
