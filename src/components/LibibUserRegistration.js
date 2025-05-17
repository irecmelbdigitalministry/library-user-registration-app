import { useState } from 'react';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

// Constants - using environment variables
// const API_ENDPOINT = 'https://api.libib.com/v1/patrons';
// We'll access these from environment variables
// USER_ID and API_KEY will be accessed through the backend now

// Main App Component
export default function LibibUserRegistration() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registeredData, setRegisteredData] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate form with improved validation
  const validateForm = () => {
    const newErrors = {};
    
    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.first_name.trim())) {
      newErrors.first_name = 'First name contains invalid characters';
    }
    
    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.last_name.trim())) {
      newErrors.last_name = 'Last name contains invalid characters';
    }
    
    // Email validation with better regex
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone validation - accepts formats like (123) 456-7890, 123-456-7890, 1234567890
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Remove all non-digit characters for checking length
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        newErrors.phone = 'Phone number must be between 10-15 digits';
      } else if (!/^(\+?\d{1,4})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    // Password validation with stronger requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter and one number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email confirmation is now handled by the backend endpoint

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Using backend service to handle API calls and email sending
      const response = await fetch('/api/register-patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // const data = await response.json();
      setRegistrationStatus('success');
      setRegisteredData(formData);
      // Email is now sent by the backend
      
    } catch (error) {
      console.error('Error registering patron:', error);
      setRegistrationStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input field component
  const InputField = ({ label, name, type = 'text', value, onChange, error }) => (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && (
        <p className="text-red-500 text-xs italic mt-1">{error}</p>
      )}
    </div>
  );

  // Registration Success Component
  const RegistrationSuccess = ({ userData }) => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">Registration Successful!</h2>
      <p className="mb-4 text-green-700">
        Thank you for registering with Libib, {userData.first_name}!
      </p>
      <div className="bg-white p-4 rounded-lg mb-4 text-left">
        <h3 className="font-bold mb-2 text-gray-700">Registration Details:</h3>
        <p className="text-gray-600"><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
        <p className="text-gray-600"><strong>Email:</strong> {userData.email}</p>
        <p className="text-gray-600"><strong>Phone:</strong> {userData.phone}</p>
      </div>
      <div className="flex items-center justify-center text-green-700">
        <Mail className="h-5 w-5 mr-2" />
        <p>A confirmation email has been sent to your email address.</p>
      </div>
    </div>
  );

  // Error Component
  const RegistrationError = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-red-800 mb-2">Registration Failed</h2>
      <p className="mb-4 text-red-700">
        There was an error processing your registration. Please try again.
      </p>
      <button
        onClick={() => setRegistrationStatus(null)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"
        ></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            {registrationStatus === 'success' ? (
              <RegistrationSuccess userData={registeredData} />
            ) : registrationStatus === 'error' ? (
              <RegistrationError />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">
                    Libib User Registration
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Please fill out the form below to register
                  </p>
                </div>
                <div>
                  <InputField
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    error={errors.first_name}
                  />
                  <InputField
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    error={errors.last_name}
                  />
                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  <InputField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                  />
                  <div className="mt-8">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}