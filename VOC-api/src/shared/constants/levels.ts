export const LEVEL = {
  MEMBER: 10,
  MINISTRY_LEADER: 40,
  HOUSE_LEADER: 50,
  PASTOR: 60,
  TREASURER: 80,
  PRESIDENT: 100,
} as const;

export type Level = (typeof LEVEL)[keyof typeof LEVEL];
