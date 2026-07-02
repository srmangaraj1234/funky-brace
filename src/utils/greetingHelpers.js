export const getGreetingAndNextTransition = () => {
  const now = new Date();
  const hours = now.getHours();
  let greeting = "";
  let nextTransitionHour = 0;

  if (hours >= 5 && hours < 12) {
    greeting = "Good morning";
    nextTransitionHour = 12;
  } else if (hours >= 12 && hours < 17) {
    greeting = "Good afternoon";
    nextTransitionHour = 17;
  } else if (hours >= 17 && hours < 22) {
    greeting = "Good evening";
    nextTransitionHour = 22;
  } else {
    greeting = "Good night";
    nextTransitionHour = 5;
  }

  const nextTransitionDate = new Date(now);
  nextTransitionDate.setHours(nextTransitionHour, 0, 0, 0);
  
  if (nextTransitionDate <= now) {
    nextTransitionDate.setDate(nextTransitionDate.getDate() + 1);
  }

  const msToNextTransition = nextTransitionDate.getTime() - now.getTime();
  return { greeting, msToNextTransition };
};
