const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hex-Port backend is running");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
