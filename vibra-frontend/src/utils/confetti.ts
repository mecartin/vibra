import confetti from 'canvas-confetti';

// Custom confetti configurations without 'heart' shape
export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF00FF', '#00FF00', '#FFD700', '#00CED1']
  });
};

export const triggerHeartConfetti = () => {
  // Use custom drawn hearts instead of shape
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#FF00FF']
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['circle'],
      origin: { y: 0.8 }
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle'],
      origin: { y: 0.8 }
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
};