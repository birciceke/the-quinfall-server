import { connect } from "mongoose";

const connection = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log("MongoDB bağlantısı başarıyla sağlandı!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connection;
