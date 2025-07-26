import React, { useState } from 'react';
import { useEmailService } from '../../hooks/useEmailService';
import { validateContactForm } from '../../utils/emailValidation';
import emailConfig from '../../config/emailConfig';

const ContactForm = ({ onSuccess, className = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  const { sendContactForm, loading, error, success } = useEmailService();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateContactForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await sendContactForm(formData);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setValidationErrors({});
      
      // Call onSuccess callback if provided
      onSuccess?.(emailConfig.SUCCESS_MESSAGES.contact);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Contact form submission failed:', err);
    }
  };

  return (
    <div className={`max-w-md mx-auto bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Us</h2>
      
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700 border border-green-300">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.subject ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.subject && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.message ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.message && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md font-medium transition duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          } text-white`}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
