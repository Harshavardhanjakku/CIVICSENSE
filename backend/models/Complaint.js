import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    ref: "District",
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  },
  status: {
    type: String,
    enum: [
      "pending",
      "assigned",
      "in progress",
      "resolved",
      "closed",
      "rejected",
    ],
    default: "pending",
  },
  notes: [
    {
      text: String,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  urgencyScore: {
    type: Number,
    default: 0,
  },
  urgencyLevel: {
    type: String,
    default: "Low",
  },
  tfidfVector: {
    type: Map,
    of: Number,
    default: {},
  },
});

export default mongoose.model("Complaint", complaintSchema);
