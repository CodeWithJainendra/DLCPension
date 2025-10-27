import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// Fade in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const SplashScreenLottie = ({ onFinish }) => {
  const [showContent, setShowContent] = useState(false);
  const [fadeOutStart, setFadeOutStart] = useState(false);

  useEffect(() => {
    // Show content after brief delay
    const showTimer = setTimeout(() => setShowContent(true), 100);
    
    // Start fade out animation
    const fadeTimer = setTimeout(() => setFadeOutStart(true), 1800);
    
    // Redirect after animation completes
    const redirectTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [onFinish]);

  if (!showContent) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: fadeOutStart 
          ? `${fadeOut} 0.6s ease-out forwards`
          : `${fadeIn} 0.6s ease-out`,
      }}
    >
      {/* Lottie Animation Container */}
      <Box
        sx={{
          width: '320px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 
          To use Lottie animation:
          1. Install: npm install lottie-react
          2. Download a Lottie JSON file (e.g., from lottiefiles.com)
          3. Place it in /public/lottie/ folder
          4. Uncomment the code below and import Lottie at the top:
          
          import Lottie from 'lottie-react';
          import animationData from '/public/lottie/loading-animation.json';
          
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        */}
        
        {/* Placeholder: Simple CSS Loading Animation */}
        <Box
          sx={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '4px solid rgba(41, 160, 113, 0.2)',
            borderTopColor: '#29a071',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Box>

      {/* App Title */}
      <Typography
        variant="h4"
        sx={{
          marginTop: '40px',
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '1px',
          animation: `${fadeIn} 1s ease-out 0.3s both`,
        }}
      >
        DLC Dashboard
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body2"
        sx={{
          marginTop: '8px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          animation: `${fadeIn} 1s ease-out 0.5s both`,
        }}
      >
        Digital Life Certificate Pension Management
      </Typography>
    </Box>
  );
};

export default SplashScreenLottie;
