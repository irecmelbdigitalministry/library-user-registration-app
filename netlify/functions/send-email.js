const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Set CORS headers to allow requests from your production domain
  const headers = {
    'Access-Control-Allow-Origin': 'https://irecmelb-libib-user-registration-app.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
    };
  }
  
  // Handle only POST requests for sending emails
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { to, subject, name, membershipId } = data;
    
    // Log email request (remove in production or limit sensitive data)
    console.log(`Email request received for: ${to}, subject: ${subject}`);

    // Validate required email fields
    if (!to || !subject) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required email fields' }),
      };
    }
    
    // Create email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4a4a4a;">Library Registration Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with IREC Melbourne Library. Your registration has been received successfully.</p>
        <p><strong>Your Membership ID:</strong> ${membershipId}</p>
        <p>Your account is now active and you can start borrowing books from our library.</p>
        <p>For any questions or assistance, please contact our library staff.</p>
        <p>Best regards,<br>IREC Melbourne Library Team</p>
      </div>
    `;
    
    // Configure email transport for Gmail
    // Note: For Gmail, you need specific settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Use the Gmail service
      auth: {
        user: process.env.GMAIL_USER,       // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Your Gmail app password, not your regular password
      }
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER || '"IREC Melbourne Library" <library@gmail.com>',
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log('Email sent successfully with messageId:', info.messageId);
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Email sent successfully',
        messageId: info.messageId
      }),
    };
    
  } catch (error) {
    // Improved error logging
    console.error('Email function error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check for specific Gmail-related error types
    let errorMessage = 'Failed to send email';
    let statusCode = 500;
    
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Gmail authentication failed. Check email and app password.';
    } else if (error.message.includes('Username and Password not accepted')) {
      errorMessage = 'Gmail credentials rejected. Ensure you are using an app password.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Check Gmail credentials.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Network error connecting to Gmail servers.';
    }
    
    // Return detailed error for debugging
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage, 
        message: error.message,
        // Include detailed error info in development but not production
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }),
    };
  }
};