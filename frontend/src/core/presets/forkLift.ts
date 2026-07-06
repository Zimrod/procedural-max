type ForkLiftProps = {
  from: number;
  to: number;
  start: number;
  duration: number;
};

export const forkLift = (
  frame: number,
  { from, to, start, duration }: ForkLiftProps
) => {
  if (frame < start) {
    return { forkLift: from };
  }

  const t = Math.min((frame - start) / duration, 1);

  return {
    forkLift: from + (to - from) * t,
  };
};