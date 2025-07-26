// Email validation utilities for frontend

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateContactForm = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.subject?.trim()) {
    errors.subject = 'Subject is required';
  }

  if (!formData.message?.trim()) {
    errors.message = 'Message is required';
  } else if (formData.message.length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateServiceRequest = (formData) => {
  const errors = {};

  if (!formData.requestorEmail?.trim()) {
    errors.requestorEmail = 'Your email is required';
  } else if (!validateEmail(formData.requestorEmail)) {
    errors.requestorEmail = 'Please enter a valid email address';
  }

  if (!formData.requestorName?.trim()) {
    errors.requestorName = 'Your name is required';
  }

  if (!formData.serviceProviderEmail?.trim()) {
    errors.serviceProviderEmail = 'Service provider email is required';
  } else if (!validateEmail(formData.serviceProviderEmail)) {
    errors.serviceProviderEmail = 'Please enter a valid service provider email';
  }

  if (!formData.serviceProviderName?.trim()) {
    errors.serviceProviderName = 'Service provider name is required';
  }

  if (!formData.serviceType) {
    errors.serviceType = 'Service type is required';
  }

  if (!formData.location?.trim()) {
    errors.location = 'Location is required';
  }

  if (!formData.dates?.trim()) {
    errors.dates = 'Dates are required';
  }

  if (!formData.message?.trim()) {
    errors.message = 'Message is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLostItemReport = (formData) => {
  const errors = {};

  if (!formData.reporterEmail?.trim()) {
    errors.reporterEmail = 'Your email is required';
  } else if (!validateEmail(formData.reporterEmail)) {
    errors.reporterEmail = 'Please enter a valid email address';
  }

  if (!formData.reporterName?.trim()) {
    errors.reporterName = 'Your name is required';
  }

  if (!formData.itemDescription?.trim()) {
    errors.itemDescription = 'Item description is required';
  } else if (formData.itemDescription.length < 10) {
    errors.itemDescription = 'Please provide a detailed description (at least 10 characters)';
  }

  if (!formData.locationLost?.trim()) {
    errors.locationLost = 'Location where item was lost is required';
  }

  if (!formData.dateLost?.trim()) {
    errors.dateLost = 'Date when item was lost is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePoolRequest = (formData) => {
  const errors = {};

  if (!formData.requesterEmail?.trim()) {
    errors.requesterEmail = 'Your email is required';
  } else if (!validateEmail(formData.requesterEmail)) {
    errors.requesterEmail = 'Please enter a valid email address';
  }

  if (!formData.requesterName?.trim()) {
    errors.requesterName = 'Your name is required';
  }

  if (!formData.poolName?.trim()) {
    errors.poolName = 'Pool name is required';
  }

  if (!formData.poolOwnerEmail?.trim()) {
    errors.poolOwnerEmail = 'Pool owner email is required';
  } else if (!validateEmail(formData.poolOwnerEmail)) {
    errors.poolOwnerEmail = 'Please enter a valid pool owner email';
  }

  if (!formData.poolOwnerName?.trim()) {
    errors.poolOwnerName = 'Pool owner name is required';
  }

  if (!formData.requestType) {
    errors.requestType = 'Request type is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
