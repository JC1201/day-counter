import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import EventModal from "./EventModal";
import "./EventSpace.css"
import { none } from "@cloudinary/url-gen/qualifiers/progressive";
import { ChevronLeft, ChevronRight, X} from "lucide-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";



export default function EventSpace() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
   // track which event’s images to show
  const [showImagesId, setShowImagesId] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null); 
  // day viewing mode
  const [eventModes, setEventModes] = useState(); 

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

  const handleModeChange = (eventId, mode) => {
  setEventModes((prev) => ({
    ...prev,
    [eventId]: mode
  }));

  localStorage.setItem("eventModes", JSON.stringify({
    ...eventModes,
    [eventId]: mode
  }));
  };

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("eventModes");
    if (saved) {
      setEventModes(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="event-space">

      {!isModalOpen && !editingEvent && (
        <button 
        className="add-event-btn" 
        onClick={() => setIsModalOpen(true)}>
          Add Event
        </button>
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
      <>
      
        <ul className="event-list">
            {events.map((event) => {
              const toMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

              const today = toMidnight(new Date());
              const startDate = toMidnight(new Date(event.startDate));

              const diffDays = Math.floor(
                (startDate - today) / (1000 * 60 * 60 * 24)
              );
        
        let status;
        const modes = eventModes?.[event.id] || "days"; // <-- key fix

        if (diffDays > 0) {
          if (modes === "days") {
            status = `Arrive in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
          } else {
            const months = Math.floor(diffDays / 30); // approx month
            const days = diffDays % 30;
            status = `Arrive in ${months > 0 ? months + " month" + (months > 1 ? "s " : " ") : ""}${days} day${days !== 1 ? "s" : ""}`;
          }
        } else if (diffDays < 0) {
          const passed = Math.abs(diffDays);
          if (modes === "days") {
            status = `${passed} day${passed === 1 ? "" : "s"} passed`;
          } else {
            const months = Math.floor(passed / 30);
            const days = passed % 30;
            status = `${months > 0 ? months + " month" + (months > 1 ? "s " : " ") : ""}${days} day${days !== 1 ? "s" : ""} passed`;
          }
        } else {
          status = "Today";
        }


        return (
          <li className="event-card" key={event.id} style={{ marginBottom: "20px" }}>
  
            <strong>{event.title}</strong> – {event.startDate}
            <button
              className="delete-btn"
              onClick={() => handleDelete(event.id)}
              style={{ background: none, color: "black" }}
            >
            <X className="w-6 h-6 text-gray-600 hover:text-red-500" />

            </button>
            <br />
            {event.description}
            <br />
            {status}
            <br />
      
            <button
              onClick={() =>
                handleModeChange(
                event.id,
                eventModes[event.id] === "days" ? "months" : "days"
                )
              }
              className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              {eventModes[event.id] === "days" ? "Days Only" : "Months + Days"}
            </button>
            
            {/* Show/Hide Images Button */}
            {event.imageUrls.length > 0 && (
              <button
                onClick={() => setShowImagesId(
                  showImagesId === event.id ? null : event.id
                )}
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
                    onClick={() => setFullscreenImage(url)}

                    style={{ width: "120px", borderRadius: "5px" }} />
                ))}
              </div>
            )}

            <br />
            <button
              onClick={() => {
                setEditingEvent(event);
                setIsModalOpen(true);
              } }
            >
              Edit
            </button>

          </li>
        );
      })}
    </ul>

    {fullscreenImage && (
  <div className="fullscreen-overlay">
    {/* Close button */}
    <button
      className="close-btn"
      onClick={() => setFullscreenImage(null)}
    >
      <X className="w-6 h-6 text-gray-600 hover:text-red-500" />
    </button>

    {/* Left arrow */}
    <button
      className="arrow-btn left"
      onClick={() => {
        const currentIndex = events
          .find((e) => e.id === showImagesId)
          .imageUrls.indexOf(fullscreenImage);

        const urls = events.find((e) => e.id === showImagesId).imageUrls;
        const prevIndex = (currentIndex - 1 + urls.length) % urls.length;
        setFullscreenImage(urls[prevIndex]);
      }}
    >
      <ChevronLeft className="w-6 h-6" />
    </button>

    {/* The image itself */}
    <img src={fullscreenImage} alt="fullscreen" />

    {/* Right arrow */}
    <button
      className="arrow-btn right"
      onClick={() => {
        const currentIndex = events
          .find((e) => e.id === showImagesId)
          .imageUrls.indexOf(fullscreenImage);

        const urls = events.find((e) => e.id === showImagesId).imageUrls;
        const nextIndex = (currentIndex + 1) % urls.length;
        setFullscreenImage(urls[nextIndex]);
      }}
    >
      <ChevronRight className="w-6 h-6" />

    </button>
  </div>
  )}

  </>
      )}
    </div>

    
  );
}
