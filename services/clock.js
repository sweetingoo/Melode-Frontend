import { api } from "./api-client";

// Clock API service
export const clockService = {
  // Check in
  clockIn: async (clockInData) => {
    try {
      return await api.post("/clock/in", clockInData);
    } catch (error) {
      console.error("Check in failed:", error);
      throw error;
    }
  },

  // Check out
  clockOut: async (clockOutData = {}) => {
    try {
      return await api.post("/clock/out", clockOutData);
    } catch (error) {
      console.error("Check out failed:", error);
      throw error;
    }
  },

  // Get clock status
  getClockStatus: async () => {
    try {
      return await api.get("/clock/current");
    } catch (error) {
      console.error("Get clock status failed:", error);
      throw error;
    }
  },

  // Get clock records
  getClockRecords: async (params = {}) => {
    try {
      return await api.get("/clock/records", { params });
    } catch (error) {
      console.error("Get clock records failed:", error);
      throw error;
    }
  },

  // Get active clocks (manager view)
  getActiveClocks: async (params = {}) => {
    try {
      return await api.get("/clock/active", { params });
    } catch (error) {
      console.error("Get active clocks failed:", error);
      throw error;
    }
  },

  // Edit clock record (manager)
  updateClockRecord: async (id, clockData) => {
    try {
      return await api.put(`/clock/records/${id}`, clockData);
    } catch (error) {
      console.error(`Update clock record ${id} failed:`, error);
      throw error;
    }
  },

  // Change shift role during shift
  changeShiftRole: async (changeData) => {
    try {
      return await api.post("/clock/role/change", changeData);
    } catch (error) {
      console.error("Change shift role failed:", error);
      throw error;
    }
  },

  // Start break
  startBreak: async (breakData = {}) => {
    try {
      return await api.post("/clock/breaks/start", breakData);
    } catch (error) {
      console.error("Start break failed:", error);
      throw error;
    }
  },

  // End break
  endBreak: async (breakData = {}) => {
    try {
      return await api.post("/clock/breaks/end", breakData);
    } catch (error) {
      console.error("End break failed:", error);
      throw error;
    }
  },
};
