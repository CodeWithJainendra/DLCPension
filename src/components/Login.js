import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

const Login = ({ onLogin }) => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes
  const otpRefs = useRef([]);

  // Timer for OTP
  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError('');
    }
  };

  const isValidPhone = () => {
    if (phoneNumber.length !== 10) return false;
    const firstDigit = phoneNumber[0];
    return ['6', '7', '8', '9'].includes(firstDigit);
  };

  const handleSendOTP = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📱 OTP sent to:', `91${phoneNumber}`);
      setStep('otp');
      setTimeLeft(240);
      
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    const fullPhoneNumber = `91${phoneNumber}`;
    console.log('📱 Verifying OTP for:', fullPhoneNumber, 'OTP:', otpString);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user data
      const userData = {
        id: Date.now(),
        username: fullPhoneNumber,
        fullName: 'User',
        email: `${phoneNumber}@example.com`,
        role: 'user',
        department: 'General',
        dataAccessLevel: 'read',
        permissions: ['read'],
        token: 'demo-token-' + Date.now()
      };

      // Use passed onLogin function
      if (onLogin) {
        const success = onLogin(userData);
        if (success) {
          console.log('✅ Login successful for:', fullPhoneNumber);
        } else {
          setError('Login failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('📱 OTP resent to:', `91${phoneNumber}`);
      setTimeLeft(240);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: '900px',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        display: 'flex'
      }}>
        {/* Green corner decorations */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200px',
          height: '200px',
          backgroundColor: '#2EB67D',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          zIndex: 0
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          backgroundColor: '#2EB67D',
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          zIndex: 0
        }} />
        
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200px',
          height: '200px',
          backgroundColor: '#2EB67D',
          clipPath: 'polygon(0 100%, 100% 100%, 0 0)',
          zIndex: 0
        }} />
        
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '200px',
          height: '200px',
          backgroundColor: '#2EB67D',
          clipPath: 'polygon(100% 100%, 0 100%, 100% 0)',
          zIndex: 0
        }} />

        {/* Left side - Image placeholder */}
        <Box sx={{
          flex: '1',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{
            width: '100%',
            height: '300px',
            backgroundColor: '#f5f5f5',
            borderRadius: '12px'
          }}>
            {/* Placeholder for image or logo */}
          </Box>
        </Box>

        {/* Right side - Login form */}
        <Box sx={{
          flex: '1',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            marginBottom: '24px',
            color: '#333'
          }}>
            Login with Phone
          </Typography>
          
          {step === 'phone' && (
            <>
              <Typography variant="body1" sx={{ 
                marginBottom: '32px',
                color: '#666'
              }}>
                Enter your phone number to receive a verification code
              </Typography>
              
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500,
                marginBottom: '8px',
                color: '#333'
              }}>
                Phone Number
              </Typography>
              
              <Box sx={{ marginBottom: '8px' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          borderRight: '1px solid #ddd',
                          paddingRight: '8px',
                          marginRight: '8px'
                        }}>
                          <PhoneIcon sx={{ color: '#2EB67D', fontSize: 20, mr: 0.5 }} />
                          <Typography sx={{ color: '#333', fontWeight: 500 }}>+91</Typography>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#ddd',
                      },
                      '&:hover fieldset': {
                        borderColor: '#2EB67D',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2EB67D',
                      },
                    },
                  }}
                />
              </Box>
              
              <Typography variant="caption" sx={{ 
                marginBottom: '24px',
                color: '#888'
              }}>
                Enter your 10-digit mobile number
              </Typography>
            </>
          )}
          
          {error && (
            <Typography variant="body2" sx={{ color: 'error.main', marginBottom: '16px' }}>
              {error}
            </Typography>
          )}

          {step === 'phone' ? (
            <Button 
              variant="contained" 
              fullWidth
              onClick={handleSendOTP}
              disabled={!isValidPhone() || isLoading}
              sx={{
                backgroundColor: isValidPhone() ? '#2EB67D' : '#a9b4c0',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: isValidPhone() ? '#27a06d' : '#98a5b3',
                },
                '&:disabled': {
                  backgroundColor: '#a9b4c0',
                  color: 'white',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send OTP'}
            </Button>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, marginBottom: '16px', color: '#333' }}>
                Enter OTP
              </Typography>
              
              <Box sx={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (otpRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }
                    }}
                    sx={{
                      width: '48px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#ddd' },
                        '&:hover fieldset': { borderColor: '#2EB67D' },
                        '&.Mui-focused fieldset': { borderColor: '#2EB67D' },
                      },
                    }}
                  />
                ))}
              </Box>

              <Typography variant="body2" sx={{ marginBottom: '16px', color: '#666', textAlign: 'center' }}>
                Time remaining: {formatTime(timeLeft)}
              </Typography>

              <Button 
                variant="contained" 
                fullWidth
                onClick={handleVerifyOTP}
                disabled={otp.join('').length !== 6 || isLoading}
                sx={{
                  backgroundColor: otp.join('').length === 6 ? '#2EB67D' : '#a9b4c0',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginBottom: '12px',
                  '&:hover': {
                    backgroundColor: otp.join('').length === 6 ? '#27a06d' : '#98a5b3',
                  },
                  '&:disabled': {
                    backgroundColor: '#a9b4c0',
                    color: 'white',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>

              <Button 
                variant="text" 
                fullWidth
                onClick={handleResendOTP}
                disabled={timeLeft > 0 || isLoading}
                sx={{
                  color: timeLeft > 0 ? '#a9b4c0' : '#2EB67D',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {timeLeft > 0 ? 'Resend OTP' : 'Resend OTP'}
              </Button>

              <Button 
                variant="text" 
                fullWidth
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
                sx={{
                  color: '#666',
                  textTransform: 'none',
                  fontWeight: 500,
                  marginTop: '8px',
                }}
              >
                Change Phone Number
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Login;