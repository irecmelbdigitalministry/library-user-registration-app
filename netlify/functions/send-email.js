// netlify/functions/send-email.js (note the filename matches your endpoint)
// Debug-enhanced version with extensive logging

const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Log everything for debugging
  console.log('=== EMAIL FUNCTION CALLED ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body:', event.body);
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for local testing
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
    };
  }
  
  // Handle only POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  try {
    // Check if body exists
    if (!event.body) {
      console.log('No body provided in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body provided' }),
      };
    }
    
    // Parse the request body
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }
    
    // Extract email data with fallbacks
    const { 
      to, 
      subject = 'Library Registration Confirmation',
      name = 'New Member',
      membershipId = 'N/A',
      firstName,
      lastName,
      email
    } = data;
    
    // Use email field if to is not provided
    const recipientEmail = to || email;
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'New Member';
    
    console.log('Email details:');
    console.log('- Recipient:', recipientEmail);
    console.log('- Subject:', subject);
    console.log('- Name:', fullName);
    console.log('- Membership ID:', membershipId);
    
    // Validate required fields
    if (!recipientEmail) {
      console.log('Missing recipient email');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Recipient email is required (to or email field)' }),
      };
    }
    
    // Check environment variables
    console.log('Environment check:');
    console.log('- GMAIL_USER exists:', !!process.env.GMAIL_USER);
    console.log('- GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('- GMAIL_USER value:', process.env.GMAIL_USER || 'NOT SET');
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('Missing Gmail environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Gmail credentials not configured',
          details: 'GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required'
        }),
      };
    }
    
    // Create email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #4a4a4a;">Library Registration Confirmation</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for registering with IREC Melbourne Library. Your registration has been received successfully.</p>
        <p><strong>Your Membership ID:</strong> ${membershipId}</p>
        <p>Your account is now active and you can start borrowing books from our library.</p>
        <p>For any questions or assistance, please contact our library staff.</p>
        <p>Best regards,<br>IREC Melbourne Library Team</p>
      </div>
    `;
    
    console.log('Creating Gmail transporter...');
    
    // Configure Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    console.log('Verifying transporter...');
    
    // Verify the transporter
    try {
      await transporter.verify();
      console.log('Gmail transporter verified successfully');
    } catch (verifyError) {
      console.log('Gmail transporter verification failed:', verifyError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Gmail authentication failed',
          message: verifyError.message,
          details: 'Check your Gmail credentials and app password'
        }),
      };
    }
    
    console.log('Sending email...');
    
    // Send email
    const info = await transporter.sendMail({
      from: `"IREC Melbourne Library" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });
    
    console.log('Email sent successfully:', info.messageId);
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Email sent successfully',
        messageId: info.messageId,
        recipient: recipientEmail
      }),
    };
    
  } catch (error) {
    console.error('=== EMAIL FUNCTION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Specific error handling
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
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage, 
        message: error.message,
        stack: error.stack // Include stack trace for debugging
      }),
    };
  }
};