import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Event({ user }) {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [file, setFile] = useState(null);

  const userUID = user.uid;

  // Fetch events shared with this user
  useEffect(() => {
    const q = query(collection(db, "events"), where("sharedWith", "array-contains", userUID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [userUID]);

  const handleAddEvent = async () => {
    let imageURL = "";
    if (file) {
      const storageRef = ref(storage, `images/${file.name}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      imageURL = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "events"), {
      eventName,
      startDate,
      imageURL,
      sharedWith: [userUID] // You can add another UID for couples here
    });

    setEventName("");
    setStartDate("");
    setFile(null);
  };

  const calculateDays = (date) => {
    const start = new Date(date);
    const today = new Date();
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <h2>Events</h2>
      <input type="text" placeholder="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} />
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleAddEvent}>Add Event</button>

      <div>
        {events.map(ev => (
          <div key={ev.id}>
            <h3>{ev.eventName}</h3>
            <p>{calculateDays(ev.startDate)} days passed</p>
            {ev.imageURL && <img src={ev.imageURL} alt="event" width="200" />}
          </div>
        ))}
      </div>
    </div>
  );
}
