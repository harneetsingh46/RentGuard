import app from "./app.js";
import db from "./src/config/db.js";
import { startUnverifiedOwnerCleanup } from "./src/utils/cleanupUnverifiedOwners.js";

// Database Connection
db()
  .then(() => {
    startUnverifiedOwnerCleanup();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

//Localhost
app.listen(process.env.PORT, () => {
  console.log(`Server is running on PORT ${process.env.PORT}`);
  // console.log("Server running on http://localhost:2000");
});
