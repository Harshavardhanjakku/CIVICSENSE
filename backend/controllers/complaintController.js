import Complaint from "../models/Complaint.js";
import axios from "axios";
import "dotenv/config";

// Submit a complaint
export const submitComplaint = async (req, res) => {
  const { title, description, location } = req.body;
  const userId = req.user.id;
  const district = req.user.district;

  if (!title || !description || !location) {
    return res
      .status(400)
      .json({ message: "Title, description, and location are required" });
  }

  try {
    const existingComplaints = await Complaint.find({}, "description").lean();
    const duplicateCheckPayload = {
      text: description,
      existing_complaints: existingComplaints.map((comp) => ({
        id: comp._id.toString(),
        text: comp.description,
      })),
    };
    const duplicateDetectionResponse = await axios.post(
      process.env.DUPLICATE_DETECTION_SERVICE_URL + "/check",
      duplicateCheckPayload
    );
    if (duplicateDetectionResponse.data.is_duplicate) {
      return res.status(409).json({
        message: "A similar complaint has already been submitted.",
        duplicateComplaintId: duplicateDetectionResponse.data.matched_id,
      });
    }
    const urgencyPredictionResponse = await axios.post(
      process.env.URGENCY_SERVICE_URL + "/predict",
      {
        Complaint: description,
        Location: location,
      }
    );
    const urgencyLevel = urgencyPredictionResponse.data.Urgency;
    const newComplaint = new Complaint({
      userId,
      title,
      description,
      location,
      district,
      status: "pending", // Ensure status defaults to pending
      tfidfVector: {}, // Initialize empty for now, microservice will populate
      urgencyScore: 0, // Initialize to 0 for now, microservice will populate
      urgencyLevel: urgencyLevel,
      createdAt: new Date(),
    });

    const savedComplaint = await newComplaint.save();
    res.status(201).json(savedComplaint);
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res
      .status(500)
      .json({ message: "Error submitting complaint", error: error.message });
  }
};

// Get all complaints for the logged-in user
export const getUserComplaints = async (req, res) => {
  const userId = req.user.id;

  try {
    const complaints = await Complaint.find({ userId });
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error retrieving complaints:", error);
    res
      .status(500)
      .json({ message: "Error retrieving complaints", error: error.message });
  }
};

// Get details of a single complaint
export const getComplaintById = async (req, res) => {
  const { id } = req.params;

  try {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.status(200).json(complaint);
  } catch (error) {
    console.error("Error retrieving complaint by ID:", error);
    res
      .status(500)
      .json({ message: "Error retrieving complaint", error: error.message });
  }
};
