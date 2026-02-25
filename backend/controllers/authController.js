import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpService from "../services/otpService.js";

const generateOtp = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const initiateRegistration = async (req, res) => {
  const { name, phoneNumber, password, district, email } = req.body;

  if (!name || !phoneNumber || !password || !district) {
    return res.status(400).json({
      message: "Name, phone number, password, and district are required",
    });
  }

  try {
    let user = await User.findOne({ phoneNumber });
    if (user && user.isVerified) {
      return res.status(400).json({
        message:
          "User with this phone number is already registered and verified.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({
        name,
        phoneNumber,
        password: hashedPassword,
        district,
        email,
        isVerified: false,
      });
    } else {
      // If user exists but is not verified, update their details
      user.name = name;
      user.password = hashedPassword;
      user.district = district;
      if (email !== undefined) {
        user.email = email;
      }
      user.isVerified = false;
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    await otpService.sendSMS(phoneNumber, `Your OTP is: ${otp}`);
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res
      .status(200)
      .json({ message: "Registration initiated. OTP sent successfully." });
  } catch (error) {
    console.error("Error in initiateRegistration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res
      .status(400)
      .json({ message: "Phone number and OTP are required" });
  }

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res
        .status(400)
        .json({
          message: "Invalid or expired OTP. Register again to get new OTP.",
        });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    // Removed population of user details here, as it's done in initiateRegistration

    await user.save();

    const token = jwt.sign(
      { id: user._id, district: user.district },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({
      message: "Phone number verified and user logged in",
      token,
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ message: "Phone number is required for login" });
  }

  try {
    let user;
    user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Phone number not verified. Please register again to get OTP.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, district: user.district },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { login, initiateRegistration, verifyOtp };
