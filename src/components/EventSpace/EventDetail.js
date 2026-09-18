import "./EventDetail.css"
import "./EventSpace.css"
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "react-swipeable-list/dist/styles.css";
import { X, ChevronRight, ChevronLeft } from "lucide-react";


export default function EventDetail() {
  const { id } = useParams(); // event ID from URL
  const [event, setEvent] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);

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

  if (!event) return       <p>Loading</p>
;

  const imageUrls = (event.imageUrls || []).map((img) =>
    typeof img === "string" ? img : img?.url || ""
  );

  return (
    <div
      className="event-detail"
      style={{
        minHeight: "20%",
        color: "black",
        padding: "20px"
      }}
    >

        {/* Back button */}
        <Link to="/" style={{ color: "black", textDecoration: "none", fontWeight: "bold" }}>
        ⬅
        </Link>

        <h1>{event.title}</h1>
        <p>{event.startDate}</p>
        <p>{event.description}</p>

        {/* More decorations, gallery, countdown etc */}
        {imageUrls.length > 0 && (

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            {imageUrls.map((url, i) => (
                <img
                key={i}
                src={url}
                alt={`Event ${i}`}
                onClick={() => setCurrentImageIndex(i)}
                className="detail-thumb"
                />
            ))}
            </div>
        )}

        {currentImageIndex !== null && imageUrls.length > 0 && (
          <div className="fullscreen-overlay">
            <button className="close-btn" onClick={() => setCurrentImageIndex(null)}>
              <X className="w-5 h-5" />
            </button>

            <button
              className="nav-btn left"
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev > 0 ? prev - 1 : imageUrls.length - 1
                )
              }
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <img
              src={imageUrls[currentImageIndex]}
              alt={`Fullscreen ${currentImageIndex + 1}`}
            />

            <button
              className="nav-btn right"
              onClick={() =>
                setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)
              }
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
    </div>
  );
}
