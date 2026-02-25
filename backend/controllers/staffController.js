import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import otpService from "../services/otpService.js";

export const getAssignedComplaints = async (req, res) => {
  try {
    const staffId = req.staff._id;
    const complaints = await Complaint.find({ assignedTo: staffId }).populate(
      "userId",
      "name phoneNumber"
    );
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching assigned complaints:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateComplaintStatus = async (req, res) => {
  const { id } = req.params; // complaint ID
  const { status } = req.body;

  try {
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.assignedTo.toString() !== req.staff._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this complaint" });
    }

    complaint.status = status;
    if (status === "resolved" || status === "closed") {
      complaint.resolvedAt = new Date();
    }
    await complaint.save();

    // notify user via SMS
    const user = await User.findById(complaint.userId);
    if (user && user.phoneNumber) {
      const userMessage = `Your complaint (ID: ${complaint._id}) status has been updated to: ${status}.`;
      await otpService.sendSMS(user.phoneNumber, userMessage);
    }

    res
      .status(200)
      .json({ message: "Complaint status updated successfully", complaint });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addComplaintNote = async (req, res) => {
  const { id } = req.params; // complaint ID
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Note text is required" });
  }

  try {
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.assignedTo.toString() !== req.staff._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to add note to this complaint" });
    }

    complaint.notes.push({ text, by: req.staff._id });
    await complaint.save();

    // notify user via SMS
    const user = await User.findById(complaint.userId);
    if (user && user.phoneNumber) {
      const userMessage = `A new note has been added to your complaint (ID: ${complaint._id}). Note: ${text}.`;
      await otpService.sendSMS(user.phoneNumber, userMessage);
    }

    res.status(200).json({ message: "Note added successfully", complaint });
  } catch (error) {
    console.error("Error adding complaint note:", error);
    res.status(500).json({ message: "Server error" });
  }
};
