export type FeedbackSession = {
  id: string;
  projectName: string;
  targetUrl: string | null;
  testerName: string;
  status: 'draft' | 'live' | 'reviewed';
  createdAt: string;
  updatedAt: string;
};

export type FeedbackPin = {
  id: string;
  sessionId: string;
  x: number;
  y: number;
  message: string;
  severity: 'note' | 'issue' | 'blocker';
  screenshotUrl: string | null;
  createdAt: string;
};
