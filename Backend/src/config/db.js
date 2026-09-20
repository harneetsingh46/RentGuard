import mongoose from "mongoose";

const db = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Database Connected !");
};

export default db;
