import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3001, () => {
      console.log(`Server is running on the port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Connection error ..", error);
  });
