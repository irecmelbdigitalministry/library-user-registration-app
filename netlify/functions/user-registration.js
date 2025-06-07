// Backend API for Libib Patron Registration
// Create this as /api/register-patron.js for Netlify serverless functions

// Import required libraries
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

require('dotenv').config();

// API credentials from environment variables
const USER_ID = process.env.LIBIB_USER_ID;
const API_KEY = process.env.LIBIB_API_KEY;
const API_ENDPOINT = 'https://api.libib.com/patrons';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Netlify serverless function handler
exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse request body
    const userData = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'password'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: `Missing required field: ${field}` }),
        };
      }
    }

    // Call Libib API to register the patron
    const libibResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-api-user': USER_ID
      },
      body: JSON.stringify(userData),
    });

    // Check if Libib API call was successful
    if (!libibResponse.ok) {
      const errorData = await libibResponse.json();
      return {
        statusCode: libibResponse.status,
        body: JSON.stringify({ message: errorData.message || 'Registration failed' }),
      };
    }

    // Registration successful, get response from Libib
    const libibData = await libibResponse.json();

    // Send confirmation email
    await sendConfirmationEmail(userData);

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Patron registered successfully',
        patron: libibData,
      }),
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

// Function to send confirmation email
async function sendConfirmationEmail(userData) {
  const { first_name, last_name, email } = userData;

  // Create email content
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Libib - Registration Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to Libib!</h2>
        <p>Dear ${first_name} ${last_name},</p>
        <p>Thank you for registering with Libib. Your account has been successfully created.</p>
        <h3 style="color: #3498db;">Your Registration Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Name:</strong> ${first_name} ${last_name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p>You can now log in to your account using your email and password to check out or hold items.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://libib.com/patron" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Access Your Account
          </a>
        </div>
        <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Libib Team</p>
      </div>
    `,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // We don't want to fail the registration if email fails
    // Just log the error and continue
    return false;
  }
}
