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
    return {
      sucess: true,
      message: "File uploaded",
      response: response[0],
      downloadURL: downloadURL[0],
    };

    // Return the download URL
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}

async function deleteFile(fileUrl) {
  try {
    console.log("Received File URL:", fileUrl);

    // Ensure fileUrl is a string
    if (typeof fileUrl !== "string") {
      console.warn("Invalid file URL:", fileUrl);
      return;
    }

    // Parse the URL to handle it properly
    let url;
    try {
      url = new URL(fileUrl);
    } catch (error) {
      console.warn("Error parsing URL:", error);
      return;
    }

    // Log the parsed URL
    console.log("Parsed URL:", url.toString());

    // Update the startsWith check to handle both Firebase and Google Cloud Storage URLs
    if (
      url
        .toString()
        .startsWith(
          "https://firebasestorage.googleapis.com/v0/b/backend-node-prod-prj.appspot.com/o/"
        ) ||
      url
        .toString()
        .startsWith(
          "https://storage.googleapis.com/backend-node-prod-prj.appspot.com/"
        )
    ) {
      // const bucket = admin.storage().bucket();
      const fileName = url.pathname.slice(1); // Remove initial "/" from path
      await bucket.file(fileName).delete();
    } else {
      console.warn(
        "File URL doesn't match Firebase or Google Cloud Storage format:",
        fileUrl
      );
    }
  } catch (error) {
    console.error("Error deleting file from Storage:", error);
    // Handle error appropriately (e.g., rethrow or log for debugging)
  }
}

export { uploadFile, deleteFile };
