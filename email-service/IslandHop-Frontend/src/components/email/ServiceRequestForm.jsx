import React, { useState } from 'react';
import { useEmailService } from '../../hooks/useEmailService';
import { validateServiceRequest } from '../../utils/emailValidation';
import emailConfig from '../../config/emailConfig';

const ServiceRequestForm = ({ onSuccess, className = '' }) => {
  const [formData, setFormData] = useState({
    requestorEmail: '',
    requestorName: '',
    serviceProviderEmail: '',
    serviceProviderName: '',
    serviceType: '',
    location: '',
    dates: '',
    message: '',
    budget: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  const { sendServiceRequest, loading, error, success } = useEmailService();

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
    const validation = validateServiceRequest(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await sendServiceRequest(formData);
      setFormData({
        requestorEmail: '',
        requestorName: '',
        serviceProviderEmail: '',
        serviceProviderName: '',
        serviceType: '',
        location: '',
        dates: '',
        message: '',
        budget: ''
      });
      setValidationErrors({});
      
      // Call onSuccess callback if provided
      onSuccess?.(emailConfig.SUCCESS_MESSAGES.serviceRequest);
    } catch (err) {
      console.error('Service request submission failed:', err);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Request Service</h2>
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Requestor Information */}
          <div>
            <label htmlFor="requestorName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              id="requestorName"
              name="requestorName"
              value={formData.requestorName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.requestorName ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.requestorName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.requestorName}</p>
            )}
          </div>

          <div>
            <label htmlFor="requestorEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Your Email *
            </label>
            <input
              type="email"
              id="requestorEmail"
              name="requestorEmail"
              value={formData.requestorEmail}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.requestorEmail ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.requestorEmail && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.requestorEmail}</p>
            )}
          </div>

          {/* Service Provider Information */}
          <div>
            <label htmlFor="serviceProviderName" className="block text-sm font-medium text-gray-700 mb-1">
              Service Provider Name *
            </label>
            <input
              type="text"
              id="serviceProviderName"
              name="serviceProviderName"
              value={formData.serviceProviderName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.serviceProviderName ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.serviceProviderName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.serviceProviderName}</p>
            )}
          </div>

          <div>
            <label htmlFor="serviceProviderEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Service Provider Email *
            </label>
            <input
              type="email"
              id="serviceProviderEmail"
              name="serviceProviderEmail"
              value={formData.serviceProviderEmail}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.serviceProviderEmail ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.serviceProviderEmail && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.serviceProviderEmail}</p>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          <select
            id="serviceType"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.serviceType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a service type</option>
            {emailConfig.SERVICE_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
          {validationErrors.serviceType && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.serviceType}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Santorini, Greece"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.location ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.location && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="dates" className="block text-sm font-medium text-gray-700 mb-1">
              Dates *
            </label>
            <input
              type="text"
              id="dates"
              name="dates"
              value={formData.dates}
              onChange={handleChange}
              placeholder="e.g., July 15-20, 2025"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.dates ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.dates && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.dates}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
            Budget (Optional)
          </label>
          <input
            type="text"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="e.g., $500-800"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            placeholder="Describe your requirements and preferences..."
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
          className={`w-full py-3 px-4 rounded-md font-medium transition duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          } text-white`}
        >
          {loading ? 'Sending Request...' : 'Send Service Request'}
        </button>
      </form>
    </div>
  );
};

export default ServiceRequestForm;
