import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Mounted once at the app root so a logged-in doctor hears the new-patient
// alert no matter which page they're on, not just while viewing /history.
const notificationSocket = io('http://localhost:5000');

const DoctorNotifications = () => {
  useEffect(() => {
    const handleNewPatient = () => {
      // Only alert if a doctor is actually logged in on this device/tab -
      // patients using /triage or /queue shouldn't hear staff notifications.
      const isDoctorLoggedIn = !!localStorage.getItem('token');
      if (!isDoctorLoggedIn) return;

      const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      notificationSound.play().catch(() => {
        // Browsers block audio autoplay until the user has interacted with the page.
        console.log("Audio playback waiting for user interaction.");
      });
    };

    notificationSocket.on('new_patient', handleNewPatient);
    return () => notificationSocket.off('new_patient', handleNewPatient);
  }, []);

  return null;
};

export default DoctorNotifications;
