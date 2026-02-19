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
      id: 't1',
      profile_id: 'demo_user_1',
      text: "Welcome to Chirp — this is a demo tweet!",
      created_at: new Date().toISOString(),
      reply_to_id: null,
    },
  ],
  likes: [],
  retweets: [],
  bookmarks: [],
  tweet_stats: [],
});

const store = makeStore();

function matchEq(row: Row, column: string, value: any) {
  return row[column] == value;
}

function makeFrom(table: keyof typeof store) {
  // Minimal query builder that supports chaining: select(...).eq(...).single() and can be awaited
  let filters: Array<{ type: 'eq' | 'in'; col: string; val: any }> = [];

  function applyFilters(items: Row[]) {
    return items.filter((row) => {
      return filters.every((f) => {
        if (f.type === 'eq') return row[f.col] == f.val;
        if (f.type === 'in') return (f.val as any[]).includes(row[f.col]);
        return true;
      });
    });
  }

  const builder: any = {
    select(cols?: string) {
      return builder;
    },
    eq(col: string, val: any) {
      filters.push({ type: 'eq', col, val });
      return builder;
    },
    in(col: string, vals: any[]) {
      filters.push({ type: 'in', col, val: vals });
      return builder;
    },
    single: async () => ({ data: applyFilters(store[table] as Row[])[0] ?? null }),
    insert: async (rows: Row | Row[]) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      arr.forEach((r) => {
        if (!r.id) r.id = `id_${Math.random().toString(36).slice(2, 9)}`;
        (store[table] as Row[]).unshift(r as Row);
      });
      return { data: arr };
    },
    delete: () => ({ eq: async (col: string, val: any) => {
      (store[table] as Row[]) = (store[table] as Row[]).filter(r => !matchEq(r as Row, col, val));
      return { data: [], error: null };
    }}),
    update: async (changes: Row) => {
      (store[table] as Row[]) = (store[table] as Row[]).map(r => ({ ...(r as Row), ...changes }));
      return { data: store[table] };
    },
    then: (onFulfilled: any, onRejected: any) => {
      // allow awaiting the builder directly
      return Promise.resolve({ data: applyFilters(store[table] as Row[]) }).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: demoUser } }),
    getSession: async () => ({ data: { session: null } }),
    signUp: async ({ email, password }: any) => ({ data: { user: { id: `u_${Date.now()}`, email } }, error: null }),
    signInWithPassword: async ({ email, password }: any) => ({ data: { user: demoUser }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: null } }),
  },
  from: (table: keyof typeof store) => makeFrom(table),
  storage: {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: any) => ({ data: { Key: 'ok' }, error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: 'https://via.placeholder.com/600x400' } }),
    }),
  },
};

export function createMockClient() {
  return mockClient;
}

export function getDemoUser() {
  return demoUser;
}
