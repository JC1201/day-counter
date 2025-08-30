import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import "./EventModal.css"; // <-- import CSS file

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
  // const [fullscreenImage, setFullscreenImage] = useState(null); 


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
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images);
      }

      const eventData = {
        title,
        startDate,
        description,
        imageUrls,
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
            <img key={idx} src={src} alt={`Preview ${idx + 1}`} />
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
    </div>
  );
}
