import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

import * as serviceaccount from "../../firebase_secrets.json";

initializeApp({
  credential: cert(serviceaccount),
  storageBucket: "backend-node-prod-prj.appspot.com",
});

const bucket = getStorage().bucket();

// added firebase to the project now jus make a reusable function wrapper to upload the file
async function uploadFile(localFilePath, remoteFilePath) {
  try {
    // Upload the file to Firebase Storage
    await bucket.upload(localFilePath, {
      destination: remoteFilePath,
      // You can set custom metadata if needed
      metadata: {
        contentType: "image/jpeg", // Adjust the content type based on your file type
      },
    });

    // Get the download URL of the uploaded file
    const downloadURL = await bucket.file(remoteFilePath).getSignedUrl({
      action: "read",
      expires: "01-01-2100", // Set an appropriate expiration date
    });

    // Return the download URL
    return downloadURL[0];
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

export { uploadFile };
