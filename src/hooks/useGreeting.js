import { useState, useEffect } from 'react';
import { getGreetingAndNextTransition } from '../utils/greetingHelpers.js';

export default function useGreeting() {
  const [greeting, setGreeting] = useState(() => {
    const { greeting } = getGreetingAndNextTransition();
    return greeting;
  });

  // Schedule dynamic greeting updates at the exact next transition
  useEffect(() => {
    let timeoutId;

    const scheduleNextUpdate = () => {
      const { greeting: currentGreeting, msToNextTransition } = getGreetingAndNextTransition();
      setGreeting(currentGreeting);

      timeoutId = setTimeout(() => {
        scheduleNextUpdate();
      }, msToNextTransition);
    };

    scheduleNextUpdate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { greeting };
}
