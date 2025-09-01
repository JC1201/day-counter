import "./EventDetail.css"
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
// import {
//   SwipeableList,
//   SwipeableListItem,
//   SwipeAction,
//   TrailingActions,
//   LeadingActions
// } from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
// import { X, Pencil } from "lucide-react";


export default function EventDetail() {
  const { id } = useParams(); // event ID from URL
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, "events", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <p>Loading...</p>;

  return (
    <div 
      className="event-detail" 
      style={{ 
        minHeight: "20%", 
        backgroundImage: `url(${event.imageUrls?.[0] || ""})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        color: "white", 
        padding: "20px" 
      }}
    >
        
        {/* Back button */}
        <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
        ⬅ 
        </Link>

        <h1>{event.title}</h1>
        <p>{event.startDate}</p>
        <p>{event.description}</p>
      
        {/* More decorations, gallery, countdown etc */}
        {event.imageUrls?.length > 1 && (

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {event.imageUrls.map((url, i) => (
                <img 
                key={i} 
                src={url} 
                alt={`Event ${i}`} 
                style={{ width: "150px", borderRadius: "10px" }} 
                />
            ))}
            </div>
        )}
    </div>
  );
}
