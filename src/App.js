import React, { useState } from "react";
import Auth from "./components/Authentication/Auth";
import Event from "./components/Event";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);

  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return (
    <>
    {/* <h1>Couple Day Counter ❤️</h1> */}
    <div className="App">
      {!user ? <Auth setUser={setUser} /> : <Event user={user} />}
    </div>
    </>
  );
}

export default App;
