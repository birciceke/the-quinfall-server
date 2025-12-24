import { connect } from "mongoose";

const connection = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log("MongoDB connection established successfully!");
  } catch (error) {
    console.error(
      "Failed to establish a connection to MongoDB: ",
      error.message
    );
    process.exit(1);
  }
};

export default connection;
