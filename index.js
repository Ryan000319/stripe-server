require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const twilio = require("twilio");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(cors());
app.use(express.json());

// Endpoint to create a PaymentIntent
app.post("/create-payment-intent", async (req, res) => {
    const { amount, currency } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Error creating PaymentIntent:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to send OTP via Twilio
app.post("/send-otp", async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    try {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const message = await twilioClient.messages.create({
            body: `Your OTP for Genshin Shop is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Twilio number
            to: phoneNumber,
        });

        console.log(`OTP sent to ${phoneNumber}: ${otp}`);
        res.status(200).json({ success: true, message: "OTP sent successfully", sid: message.sid });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Root route for testing
app.get("/", (req, res) => {
    res.send("Stripe and Twilio Server is running!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
