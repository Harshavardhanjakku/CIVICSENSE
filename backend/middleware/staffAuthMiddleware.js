import jwt from "jsonwebtoken";
import Staff from "../models/Staff.js";

const staffAuthMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "staff") {
      return res
        .status(403)
        .json({ message: "Access denied, not a staff member" });
    }

    const staff = await Staff.findById(decoded.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    req.staff = staff;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default staffAuthMiddleware;
