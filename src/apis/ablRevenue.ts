
import apiFetch from "@/components/utils/fetchInstance";

// Create AblRevenue
const createAblRevenue = async (AblRevenue: any) => {
  try {
    const response = await apiFetch('AblRevenue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblRevenue),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All AblRevenues
const getAllAblRevenue = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AblRevenue?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single AblRevenue
const getSingleAblRevenue = async (id: string) => {
  try {
    const response = await apiFetch(`AblRevenue/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update AblRevenue
const updateAblRevenue = async (id: string, AblRevenue: any) => {
  try {
    const response = await apiFetch(`AblRevenue`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblRevenue),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteAblRevenue = async (id: string) => {
  try {
    const response = await apiFetch(`AblRevenue/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAblRevenue,
  getAllAblRevenue,
  getSingleAblRevenue,
  updateAblRevenue,
  deleteAblRevenue,
};