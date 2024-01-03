import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on the port ${process.env.PORT}`);
});
