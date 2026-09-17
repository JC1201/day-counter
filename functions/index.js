/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const cloudinary = require("cloudinary").v2;

const cloudinaryApiSecret = defineSecret("CLOUDINARY_API_SECRET");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Delete image function
exports.deleteImage = onCall({ secrets: [cloudinaryApiSecret] }, async (request) => {
  try {
    const { publicId } = request.data;
    if (!publicId) {
      throw new HttpsError("invalid-argument", "Missing publicId");
    }

    cloudinary.config({
      cloud_name: "dipwgoxiy",
      api_key: "921174229873194",
      api_secret: cloudinaryApiSecret.value(),
    });

    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, result };
  } catch (err) {
    console.error("Cloudinary deletion failed:", err);
    throw new HttpsError("internal", "Failed to delete image");
  }
});