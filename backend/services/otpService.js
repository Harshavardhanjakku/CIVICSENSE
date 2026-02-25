import twilio from "twilio";
import dotenv from "dotenv/config";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (toPhoneNumber, message) => {
  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: toPhoneNumber,
    });
    console.log(`SMS sent to ${toPhoneNumber}: ${message}`);
  } catch (error) {
    console.error(`Error sending SMS to ${toPhoneNumber}: ${error.message}`);
    throw new Error("Failed to send SMS");
  }
};

export default { sendSMS };
