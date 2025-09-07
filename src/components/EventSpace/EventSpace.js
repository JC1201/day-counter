import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import EventModal from "./EventModal";
import "./EventSpace.css";
import { X, Pencil, Eye, Camera, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "react-swipeable-list/dist/styles.css";
import {
  SwipeableList,
  SwipeableListItem,
  TrailingActions,
  SwipeAction,
  Type as ListType,
} from "react-swipeable-list";

export default function EventSpace() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventModes, setEventModes] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [currentEventImages, setCurrentEventImages] = useState([]); // 👈 store which event’s images we’re viewing

  const fetchEvents = async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const eventsList = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      imageUrls: docSnap.data().imageUrls || [],
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

    if (!confirmDelete) {
      
      return;
    }
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleModeChange = (eventId, mode) => {
    setEventModes((prev) => ({
      ...prev,
      [eventId]: mode,
    }));
    localStorage.setItem(
      "eventModes",
      JSON.stringify({
        ...eventModes,
        [eventId]: mode,
      })
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("eventModes");
    if (saved) setEventModes(JSON.parse(saved));
  }, []);

  return (
    <div className="event-space">
      {!isModalOpen && !editingEvent && (
        <button className="add-event-btn" onClick={() => setIsModalOpen(true)}>
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
        <SwipeableList type={ListType.IOS}>

          {events.map((event) => {
            const today = new Date();
            const startDate = new Date(event.startDate);
            const diffDays = Math.floor(
              (startDate - today) / (1000 * 60 * 60 * 24)
            );

            const modes = eventModes?.[event.id] || "days";
            let status;
            if (diffDays > 0) {
              status =
                modes === "days"
                  ? `Arrive in ${diffDays} days`
                  : `Arrive in ${Math.floor(diffDays / 30)} months ${diffDays % 30} days`;
            } else if (diffDays < 0) {
              const passed = Math.abs(diffDays);
              status =
                modes === "days"
                  ? `${passed} days passed`
                  : `${Math.floor(passed / 30)} months ${passed % 30} days passed`;
            } else {
              status = "Today";
            }

            const trailingActions = () => (
              <TrailingActions>
                <SwipeAction
                  onClick={() =>
                  handleModeChange(event.id, modes === "days" ? "months" : "days")
                  }
                  className = "swipe-action view"
                >
                  <Eye className="w-5 h-5 text-purple-500" />
                </SwipeAction>

                <SwipeAction
                  onClick={() => {
                    setEditingEvent(event);
                    setIsModalOpen(true);
                  }}
                  className = "swipe-action edit"
                >
                  <Pencil className="w-5 h-5 text-blue-500" />
                </SwipeAction>

                <SwipeAction
                    onClick={() => {
                    setCurrentEventImages(event.imageUrls);
                    setCurrentImageIndex(0); 
                    }}
                    className = "swipe-action img"
                >
                    <Camera className="w-5 h-5 text-blue-500" />
                  
                </SwipeAction> 

                <SwipeAction 
                  // destructive={true} 
                  onClick={() => handleDelete(event.id)}
                  className = "swipe-action close"

                >
                  <X />
                </SwipeAction>
              </TrailingActions>
            );

            return (
              <SwipeableListItem type={ListType.ANDROID} key={event.id} trailingActions={trailingActions()}>
                <Link
                  to={`/event/${event.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                <li className="event-card">
                  <div className="event-header">
                    <strong className="event-title">{event.title} - </strong>
                    <span className="event-date">{event.startDate}</span>
                  </div>

                  <p className="event-description">{event.description}</p>

                  <span className="event-status">
                    {status}
                  </span>
                </li>

                </Link>
              </SwipeableListItem>
            );
          })}
        </SwipeableList>
      )}

      {/* Fullscreen Image Viewer */}
      {currentImageIndex !== null && currentEventImages.length > 0 && (
        <div className="fullscreen-modal">
          
          <button className="close-btn" onClick={() => setCurrentImageIndex(null)}>
            <X className="w-5 h-5" />
          </button>

          <button
            className="nav-btn left"
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev > 0 ? prev - 1 : currentEventImages.length - 1
              )
            }
          >
            <ChevronLeft className="w-5 h-5" />

          </button>

          <img
            src={currentEventImages[currentImageIndex]}
            alt={`Fullscreen ${currentImageIndex + 1}`}
            className="fullscreen-img"
          />

          <button
            className="nav-btn right"
            onClick={() =>
              setCurrentImageIndex((prev) =>
                (prev + 1) % currentEventImages.length
              )
            }
          >
          <ChevronRight className="w-5 h-5" />

          </button>
        </div>
      )}
    </div>
  );
}
