import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";

export default function EventModal({
  isOpen,
  setIsOpen,
  refreshEvents,
  editingEvent,
  setEditingEvent,
  onUpdateEvent,
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");

  // Pre-fill fields when editing an event
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setStartDate(editingEvent.startDate || "");
      setDescription(editingEvent.description || "");
    } else {
      // Reset if creating new event
      setTitle("");
      setStartDate("");
      setDescription("");
    }
  }, [editingEvent]);

  const handleSave = async () => {
    try {
      const eventData = {
        title,
        startDate,
        description,
      };

      if (editingEvent) {
        // 🔹 Update existing event
        await onUpdateEvent(editingEvent.id, eventData);
        setEditingEvent(null);
      } else {
        // 🔹 Add new event
        await addDoc(collection(db, "events"), eventData);
      }

      refreshEvents();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEvent(null); // reset edit mode when modal closes
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <h2>{editingEvent ? "Edit Event" : "Add Event"}</h2>

      <input
        type="text"
        placeholder="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <textarea
        placeholder="Event Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <button onClick={handleSave}>
          {editingEvent ? "Update Event" : "Save Event"}
        </button>
        <button onClick={handleClose}>Cancel</button>
      </div>
    </div>
  );
}
