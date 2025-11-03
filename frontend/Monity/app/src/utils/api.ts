type User = { id: string; email: string };

// Mocked API. Replace with real network calls.
export const api = {
  auth: {
    async login(email: string, _password: string): Promise<User> {
      await wait(400);
      return { id: "u_1", email };
    },
    async signup(email: string, _password: string): Promise<User> {
      await wait(500);
      return { id: "u_2", email };
    },
    async logout(): Promise<void> {
      await wait(200);
    },
    async getMe(): Promise<User | null> {
      await wait(200);
      return null; // Not logged-in by default
    },
  },
  transactions: {
    async list() {
      await wait(250);
      return [
        {
          id: "t1",
          title: "Coffee",
          amount: -4.5,
          date: new Date().toISOString(),
        },
        {
          id: "t2",
          title: "Salary",
          amount: 1200,
          date: new Date().toISOString(),
        },
      ];
    },
    async add(payload: {
      title: string;
      amount: number;
      date: string;
      category?: string;
    }) {
      await wait(250);
      return { id: String(Math.random()), ...payload };
    },
  },
};

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Default export to prevent Expo Router from treating this as a route
export default function ApiUtils() {
  return null;
}
