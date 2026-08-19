import express from "express";
import cors from "cors";

const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: "http://localhost:5175"
}));

// Example route
app.get("/api/recommend", (req, res) => {
  res.json({ message: "CORS works!" });
});

app.listen(8000, () => {
  console.log("Backend running on port 8000");
});
