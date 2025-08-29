import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import EventModal from "./EventModal";
import "./EventSpace.css"

export default function EventSpace() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showImagesId, setShowImagesId] = useState(null); // track which event’s images to show

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsList = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      imageUrls: docSnap.data().imageUrls || [], // ensure it's always an array
    }));
    setEvents(eventsList);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateEvent = async (id, updatedData) => {
    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, updatedData);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  return (
    <div className="event-space">
      {!isModalOpen && !editingEvent && (
        <button onClick={() => setIsModalOpen(true)}>Add Event</button>
      )}

      <EventModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        refreshEvents={fetchEvents}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        onUpdateEvent={handleUpdateEvent}
      />

      <h2>Event List</h2>
      {events.length === 0 ? (
        <p>No events set yet.</p>
      ) : (
        <ul className="event-list">
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
              <li className= "event-card" key={event.id} style={{ marginBottom: "20px" }}>
                <strong>{event.title}</strong> – {event.startDate}
                <br />
                {event.description}
                <br />
                {status}
                <br />

                {/* Show/Hide Images Button */}
                {event.imageUrls.length > 0 && (
                  <button
                    onClick={() =>
                      setShowImagesId(
                        showImagesId === event.id ? null : event.id
                      )
                    }
                  >
                    {showImagesId === event.id ? "Hide Pictures" : "Show Pictures"}
                  </button>
                )}

                {/* Display all images if toggled */}
                {showImagesId === event.id && (
                  <div className="image-gallery" style={{ display: "flex", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
                    {event.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Event ${idx + 1}`}
                        style={{ width: "120px", borderRadius: "5px" }}
                      />
                    ))}
                  </div>
                )}

                <br />
                <button
                  onClick={() => {
                    setEditingEvent(event);
                    setIsModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  style={{ background: "red", color: "white" }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
