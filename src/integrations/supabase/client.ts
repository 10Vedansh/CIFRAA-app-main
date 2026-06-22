export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    setSession: async () => {},
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ error: null }),
    update: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  }),
  functions: {
    invoke: async () => ({ data: null, error: new Error('Not available offline') }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    unsubscribe: () => {},
  }),
  removeChannel: () => {},
};
