import React, { useState } from "react";
import Auth from "./components/Auth";
import Event from "./components/Event";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);

  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return (
    <div className="App">
      {!user ? <Auth setUser={setUser} /> : <Event user={user} />}
    </div>
  );
}

export default App;
