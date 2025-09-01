import { useState, useEffect, useRef } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import "./EventModal.css";

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
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setStartDate(editingEvent.startDate || "");
      setDescription(editingEvent.description || "");
      setImagePreviews(editingEvent.imageUrls || []);
      setImages([]);
    } else {
      setTitle("");
      setStartDate("");
      setDescription("");
      setImagePreviews([]);
      setImages([]);
    }
  }, [editingEvent]);

  const uploadImages = async (files) => {
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "Events-image");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dipwgoxiy/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      urls.push(data.secure_url);
    }
    return urls;
  };

  const handleSave = async () => {
    try {
      let newImageUrls = [];
      if (images.length > 0) {
        newImageUrls = await uploadImages(images);
      }

      const eventData = {
        title,
        startDate,
        description,
        location,        // 🔹 Save location name
        coordinates,     // 🔹 Save lat/lng
        imageUrls: editingEvent
        ? [...(editingEvent.imageUrls || []), ...newImageUrls]
        : newImageUrls,      

      };

      if (editingEvent) {
        await onUpdateEvent(editingEvent.id, eventData);
        setEditingEvent(null);
      } else {
        await addDoc(collection(db, "events"), eventData);
      }

      refreshEvents();
      handleClose();
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

    const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place) {
      setLocation(place.formatted_address);
      setCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEvent(null);
    setImages([]);
    setImagePreviews([]);
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

            {/* 🔹 Google Maps Location Input */}
      <LoadScript googleMapsApiKey="AIzaSyAFo1i9gO7otZlFIY7OKP7oeovOF9FybM0" libraries={["places"]}>
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        </Autocomplete>

        {/* Show map only if coords exist */}
        {coordinates && (
          <GoogleMap
            mapContainerStyle={{ height: "200px", width: "100%" }}
            center={coordinates}
            zoom={14}
          >
            <Marker position={coordinates} />
          </GoogleMap>
        )}
      </LoadScript>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);
          setImages((prev) => [...prev, ...files]);
          setImagePreviews((prev) => [
            ...prev,
            ...files.map((file) => URL.createObjectURL(file)),
          ]);
        }}
      />

      {imagePreviews.length > 0 && (
        <div className="image-preview-container">
          {imagePreviews.map((src, idx) => (
            <img 
            key={idx} src={src} alt={`Preview ${idx + 1}`}
            onClick={() => setFullscreenImage(src)}
            className="preview-img"
            />
          ))}
        </div>
      )}

      <div className="modal-actions">
        <button className="save-btn" onClick={handleSave}>
          {editingEvent ? "Update Event" : "Save Event"}
        </button>
        <button className="cancel-btn" onClick={handleClose}>
          Cancel
        </button>
      </div>

      {/* //fullscreen function */}
      {fullscreenImage && (
      <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
        <img src={fullscreenImage} alt="Fullscreen Preview" className="fullscreen-img" />
      </div>
      )}

    </div>
  );
}
