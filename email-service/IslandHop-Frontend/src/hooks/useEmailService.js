import { useState, useCallback } from 'react';
import emailService from '../api/emailService';
import emailConfig from '../config/emailConfig';

export const useEmailService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleRequest = useCallback(async (request, successMessage) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await request();
      setSuccess(successMessage);
      return result;
    } catch (err) {
      const errorMessage = err.message || emailConfig.ERROR_MESSAGES.generic;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendEmail = useCallback(async (emailData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendEmail(emailData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendBulkEmail = useCallback(async (bulkEmailData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendBulkEmail(bulkEmailData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendContactForm = useCallback(async (contactData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendContactForm(contactData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendWelcomeEmail = useCallback(async (welcomeData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendWelcomeEmail(welcomeData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const testEmailConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.testEmailConfig();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerificationEmail = useCallback(async (verificationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendVerificationEmail(verificationData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPoolRequest = useCallback(async (poolRequestData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendPoolRequest(poolRequestData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendServiceRequest = useCallback(async (serviceRequestData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendServiceRequest(serviceRequestData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendLostItemReport = useCallback(async (lostItemData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailService.sendLostItemReport(lostItemData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    clearMessages,
    handleRequest,
    sendEmail,
    sendBulkEmail,
    sendContactForm,
    sendWelcomeEmail,
    testEmailConfig,
    sendVerificationEmail,
    sendPoolRequest,
    sendServiceRequest,
    sendLostItemReport
  };
};

export default useEmailService;
