export const forkLift = (frame, { from, to, start, duration }) => {
  if (frame < start) return { forkLift: from };

  const t = Math.min((frame - start) / duration, 1);

  return {
    forkLift: from + (to - from) * t,
  };
};