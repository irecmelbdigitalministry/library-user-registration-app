// test-gmail.js
// Run this script locally to test your Gmail credentials
// Usage: node test-gmail.js

require('dotenv').config(); // Load environment variables from .env file
const nodemailer = require('nodemailer');

async function testGmailConnection() {
  console.log('=== Testing Gmail Connection ===');
  
  // Check environment variables
  console.log('GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET');
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'SET (hidden)' : 'NOT SET');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Missing environment variables!');
    console.log('Make sure to set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
    return;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    console.log('📧 Created Gmail transporter');
    
    // Verify connection
    console.log('🔍 Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection verified successfully!');
    
    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test App" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself for testing
      subject: 'Test Email from Library App',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify Gmail integration is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Gmail test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('2. Enable 2-Step Verification in your Google Account');
      console.log('3. Generate an App Password at: https://myaccount.google.com/apppasswords');
    }
  }
}

// Run the test
testGmailConnection();