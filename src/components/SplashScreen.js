import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import Lottie from 'lottie-react';
import animationData from '../lottie-ripple-animation.json';

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

const SplashScreen = ({ onFinish }) => {
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: fadeOutStart 
          ? `${fadeOut} 0.6s ease-out forwards`
          : `${fadeIn} 0.6s ease-out`,
      }}
    >
      {/* Lottie Ripple Loading Animation */}
      <Box
        sx={{
          width: '320px',
          height: '320px',
        }}
      >
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
  );
};

export default SplashScreen;
