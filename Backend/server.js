import app from "./app.js";
import db from "./src/config/db.js";

// Database Connection
db();

//Localhost
app.listen(process.env.PORT, () => {
  console.log(`Server is running on PORT ${process.env.PORT}`);
  console.log("Server running on http://localhost:2000");
});
