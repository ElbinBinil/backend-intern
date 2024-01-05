import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import serviceaccount from "../../firebase_secrets.json" assert { type: "json" };

try {
  initializeApp({
    credential: cert(serviceaccount),
    storageBucket: "backend-node-prod-prj.appspot.com",
  });
} catch (error) {
  console.error("Error at firebase: ", error);
}

const bucket = getStorage().bucket();

// added firebase to the project now jus make a reusable function wrapper to upload the file
async function uploadFile(localFilePath) {
  try {
    // Upload the file to Firebase Storage
    const remoteFilePath = `images/profiles/${uuidv4()}`;
    const response = await bucket.upload(localFilePath, {
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

    fs.unlinkSync(localFilePath);
    return response, downloadURL[0];

    // Return the download URL
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

export { uploadFile };
