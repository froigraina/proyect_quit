export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthContext = {
  user: AuthenticatedUser;
  sessionId: string;
};
