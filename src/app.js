import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.json({
    data: "Welcome to backend api!!",
  });
});

app.get("/api", (req, res) => {
  res.json({
    data: "Start with all the various methods check for the documentation",
  });
});

app.use("/api/users", userRoutes);

export { app };
