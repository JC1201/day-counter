import React, { useState } from "react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import "./Auth.css"

export default function Auth({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in ✅");

      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

      }
      setUser(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>

    <div className="auth-container">
      <div className="auth-box">
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
      </form>

      <a 
        href="#" 
        className="toggle-link" 
        onClick={(e) => {
          e.preventDefault(); // prevent page reload
          setIsLogin(!isLogin);
        }}
      >
        {isLogin ? "Create new account" : "Already have account?"}
      </a>

      </div>
    </div>

    </>
  );
}
