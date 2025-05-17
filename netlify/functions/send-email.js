const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { email, firstName, lastName } = data;
    
    if (!email || !firstName || !lastName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Create a Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Your Gmail app password
      }
    });

    // Optional: Also save registration data to a database or file storage system
    // This could be done using a simple JSON file, a database, or a service like Airtable
    
    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 5px;
          }
          .header {
            background-color: #1e50c9;
            color: white;
            padding: 20px;
            text-align: center;
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
          }
          .content {
            padding: 20px;
          }
          .footer {
            background-color: #f8f8f8;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-bottom-left-radius: 5px;
            border-bottom-right-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Libib!</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName} ${lastName},</p>
            <p>Thank you for registering with the Libib Patron Registration System. Your account has been successfully created.</p>
            <p>You can now log in using your email address and the password you provided during registration.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Libib Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Libib. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Setup email data
    const mailOptions = {
      from: `"Libib Registration" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Libib - Registration Successful',
      html: htmlContent
    };

    // Send mail
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Registration successful! Confirmation email sent.' })
    };
  } catch (error) {
    console.error('Error during registration process:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Registration failed', error: error.message })
    };
  }
};