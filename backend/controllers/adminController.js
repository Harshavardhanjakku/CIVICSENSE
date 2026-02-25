import Staff from "../models/Staff.js";
import bcrypt from "bcryptjs";
import otpService from "../services/otpService.js";
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

export const addStaff = async (req, res) => {
  const { name, address, phone, password } = req.body;
  const adminDistrict = req.admin.district;
  const addedByAdmin = req.admin._id;

  if (!name || !address || !phone || !password) {
    return res
      .status(400)
      .json({ message: "Name, address, phone, and password are required" });
  }

  try {
    let staff = await Staff.findOne({ phone });
    if (staff) {
      return res.status(400).json({
        message: "Staff with this phone number already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    staff = new Staff({
      name,
      address,
      phone,
      password: hashedPassword,
      district: adminDistrict,
      addedByAdmin,
    });

    await staff.save();

    const message = `You have been added as a staff member for ${adminDistrict} district. Your phone number is ${phone} and password is ${password}. Please login to the portal.`;
    await otpService.sendSMS(phone, message);

    res.status(201).json({ message: "Staff added successfully", staff });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getComplaintsByDistrict = async (req, res) => {
  try {
    const adminDistrict = req.admin.district;
    const complaints = await Complaint.find({ district: adminDistrict }).populate('userId','name phoneNumber');
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints by district:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const assignComplaintToStaff = async (req, res) => {
  const { id } = req.params; // complaint ID
  const { staffId } = req.body;

  try {
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.district !== req.admin.district) {
      return res
        .status(403)
        .json({ message: "Unauthorized to assign this complaint" });
    }

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    complaint.assignedTo = staffId;
    complaint.status = "assigned";
    await complaint.save();

    // notify staff via SMS
    const staffMessage = `Complaint ID ${complaint._id} has been assigned to you. Title: ${complaint.title}. Description: ${complaint.description}. Location: ${complaint.location}. Urgency: ${complaint.urgencyLevel}`;
    await otpService.sendSMS(staff.phone, staffMessage);

    // notify user via SMS
    const user = await User.findById(complaint.userId);
    if (user && user.phoneNumber) {
      const userMessage = `Your complaint (ID: ${complaint._id}) has been assigned to a staff member ${staff.name}. Contact them at ${staff.phone}. Status: ${complaint.status}.`;
      await otpService.sendSMS(user.phoneNumber, userMessage);
    }

    res
      .status(200)
      .json({ message: "Complaint assigned successfully", complaint });
  } catch (error) {
    console.error("Error assigning complaint:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStaffByDistrict = async (req, res) => {
  try {
    const adminDistrict = req.admin.district;
    const staff = await Staff.find({ district: adminDistrict }).select(
      "-password"
    ); // to exclude password
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff by district:", error);
    res.status(500).json({ message: "Server error" });
  }
};
