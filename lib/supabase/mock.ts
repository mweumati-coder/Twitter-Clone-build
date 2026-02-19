type Row = Record<string, any> & { id?: string };

const demoUser = {
  id: 'demo_user_1',
  email: 'demo@local',
  username: 'demo_user',
  avatar_url: null,
};

const makeStore = () => ({
  profiles: [
    { id: 'demo_user_1', username: 'demo_user', name: 'Demo User', avatar_url: null },
  ],
  tweets: [
    {
      // (file updated) See commit for new persistent server-backed and browser-backed demo clients
      profile_id: 'demo_user_1',
