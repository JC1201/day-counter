import { useState, useEffect, useRef } from "react";
import { addDoc, collection, doc, updateDoc, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { GoogleMap, LoadScript, Marker, Autocomplete, Data} from "@react-google-maps/api";
import "./EventModal.css";
import { X } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { data } from "react-router-dom";


const libraries = ["places"];

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
  const functions = getFunctions();
  const deleteImageFn = httpsCallable(functions, "deleteImage");


  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setStartDate(editingEvent.startDate || "");
      setDescription(editingEvent.description || "");
      // 🔹 Normalize imageUrls into objects
      const normalized = (editingEvent.imageUrls || []).map(img =>
        typeof img === "string" ? { url: img, publicId: null } : img
      );
      setImagePreviews(normalized);      
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
      urls.push({ url: data.secure_url, publicId: data.public_id });
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

  // const handlePlaceChanged = () => {
  //   const place = autocompleteRef.current.getPlace();

  //   if (place) {
  //     setLocation(place.formatted_address);
  //     setCoordinates({
  //       lat: place.geometry.location.lat(),
  //       lng: place.geometry.location.lng(),
  //     });
  //   }
  // };

  // const PlaceAutocomplete = (props) => {
  //   return <gmpx-place-autocomplete {...props}></gmpx-place-autocomplete>;
  // };


  const handleClose = () => {
    
    setIsOpen(false);
    setEditingEvent(null);
    setTitle("");
    setStartDate("");
    setDescription("");
    setImages([]);
    setImagePreviews([]);
  };

  // helpers inside your EventModal component (place near top)
const isBlobUrl = (u) => typeof u === "string" && u.startsWith("blob:");
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  // tries to extract public_id from typical Cloudinary secure_url pattern:
  // https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<public_id>.<ext>
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg|bmp|tiff|heic)$/i);
  return m ? m[1] : null;
};

const handleDeleteImage = async (imgObj, idx) => {
  try {
    // 1) If this is a local, unsaved file (blob) -> remove locally only
    if (!imgObj.publicId && isBlobUrl(imgObj.url)) {
      setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
      setImages((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    // 2) Determine target publicId and url to match in Firestore
    const targetUrl = imgObj.url || null;
    const targetPublicId = imgObj.publicId || extractPublicIdFromUrl(targetUrl);

    // 3) Call Cloud Function to delete from Cloudinary (if we have a publicId)
    if (targetPublicId) {
      const res = await deleteImageFn({ publicId: targetPublicId });
      console.log("deleteImageFn result:", res.data ?? res);
    } else {
      console.warn("No publicId found; skipping Cloudinary deletion");
    }

    // 4) Update Firestore document (load -> filter -> overwrite)
    if (editingEvent?.id) {
      const eventRef = doc(db, "events", editingEvent.id);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const currentImagesRaw = eventSnap.data().imageUrls || [];
        // Normalize each stored item to {url, publicId}
        const currentImages = currentImagesRaw.map((i) =>
          typeof i === "string" ? { url: i, publicId: null } : i
        );

        // Keep images that DO NOT match by publicId OR url.
        const updatedImages = currentImages.filter(
          (i) => !( (targetPublicId && i.publicId === targetPublicId) || (targetUrl && i.url === targetUrl) )
        );

        await updateDoc(eventRef, { imageUrls: updatedImages });
        console.log("Firestore updated imageUrls");
      }
    }

    // 5) Finally update local UI state
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setImages((prev) => prev.filter((_, i) => i !== idx));
  } catch (err) {
    console.error("Failed to delete image:", err);
    alert("Failed to delete image. Check console & Cloud Functions logs.");
  }
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

      {/* <LoadScript
        googleMapsApiKey="YOUR_API_KEY"
        libraries={libraries}
      >
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={() => {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry) {
              setLocation(place.formatted_address || "");
              setCoordinates({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            }
          }}
        >
          <input
            type="text"
            placeholder="Search Location"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          />
        </Autocomplete>

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
*/}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files);
          for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "Events-image");

            const res = await fetch(
              "https://api.cloudinary.com/v1_1/dipwgoxiy/image/upload",
              { method: "POST", body: formData }
            );
            const data = await res.json();

            setImagePreviews((prev) => [
              ...prev,
              { url: data.secure_url, publicId: data.public_id }
            ]);
          }
          // clear input value so same file can be re-selected if needed
          e.target.value = "";
        }}
      />


      {imagePreviews.map((image, idx) => {
        // Normalize so we always have {url, publicId}
        const imgObj = typeof image === "string" ? { url: image, publicId: null } : image;

        return (
          <div key={idx} className="preview-wrapper">
            <img
              src={imgObj.url}
              alt={`Preview ${idx + 1}`}
              onClick={() => setFullscreenImage(imgObj.url)}
              className="preview-img"
            />

            <button type="button" className="delete-img-btn" onClick={() => handleDeleteImage(imgObj, idx)}>
              <X />
            </button>

          </div>
        );
      })}

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
