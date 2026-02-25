import District from "../models/District.js";

export const getDistricts = async (req, res) => {
  try {
    const districts = await District.find({}).select("name");
    res.status(200).json(districts.map((district) => district.name)); // returns an array of names
  } catch (error) {
    console.error("Error while requesting districts: ", error)
    res
      .status(500)
      .json({ message: "Error retrieving districts", error: error.message });
  }
};
