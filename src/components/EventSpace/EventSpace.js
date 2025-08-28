import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import EventModal from "./EventModal";

export default function EventSpace() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // track which event is being edited

  // Fetch events from Firestore
  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsList = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    setEvents(eventsList);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to update an event in Firestore
  const handleUpdateEvent = async (id, updatedData) => {
    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, updatedData);
      console.log("Event updated!");
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  return (
    <div>
      {/* Only show Add button when not editing and modal is closed */}
      {!isModalOpen && !editingEvent && (
        <button onClick={() => setIsModalOpen(true)}>Add Event</button>
      )}

      <EventModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        refreshEvents={fetchEvents}
        editingEvent={editingEvent}          // pass event being edited
        setEditingEvent={setEditingEvent}    // so modal can reset after edit
        onUpdateEvent={handleUpdateEvent}    // function to update Firestore
      />

      <h2>Event List</h2>
      {events.length === 0 ? (
        <p>No events set yet.</p>
      ) : (
        <ul>
          {events.map((event) => {
            const toMidnight = (d) =>
              new Date(d.getFullYear(), d.getMonth(), d.getDate());

            const today = toMidnight(new Date());
            const startDate = toMidnight(new Date(event.startDate));

            const diffDays = Math.floor(
              (startDate - today) / (1000 * 60 * 60 * 24)
            );

            let status;
            if (diffDays > 0) {
              status = `Arrive in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
            } else if (diffDays < 0) {
              const passed = Math.abs(diffDays);
              status = `${passed} day${passed === 1 ? "" : "s"} passed`;
            } else {
              status = "Today";
            }

            return (
              <li key={event.id}>
                <strong>{event.title}</strong> – {event.startDate}
                <br />
                {event.description}
                <br />
                {status}
                <br />
                <button
                  onClick={() => {
                    setEditingEvent(event); // set event to edit
                    setIsModalOpen(true);  // open modal
                  }}
                >
                  Edit
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
