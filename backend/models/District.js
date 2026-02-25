import mongoose from "mongoose";

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

export default mongoose.model("District", districtSchema);
