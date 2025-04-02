
import apiFetch from "@/components/utils/fetchInstance";

// Create Revenue
const createRevenue = async (Revenue: any) => {
  try {
    const response = await apiFetch('Revenue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Revenue),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Revenues
const getAllRevenue = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Revenue?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Revenue
const getSingleRevenue = async (id: string) => {
  try {
    const response = await apiFetch(`Revenue/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Revenue
const updateRevenue = async (id: string, Revenue: any) => {
  try {
    const response = await apiFetch(`Revenue/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Revenue),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Revenue
const deleteRevenue = async (id: string) => {
  try {
    const response = await apiFetch(`Revenue/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createRevenue,
  getAllRevenue,
  getSingleRevenue,
  updateRevenue,
  deleteRevenue,
};