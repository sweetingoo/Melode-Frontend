import { api } from "./api-client";

export const legalService = {
  /** Authenticated: same payload as public signup terms. */
  getTerms: async () => {
    return await api.get("/legal/terms");
  },

  updateTerms: async (payload) => {
    return await api.put("/legal/terms", payload);
  },

  /** Unauthenticated: for signup page. */
  getTermsPublic: async () => {
    return await api.get("/auth/terms-public");
  },
};
