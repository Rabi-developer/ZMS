
import apiFetch from "@/components/utils/fetchInstance";

// Create GSM
const createGSM = async (GSM: any) => {
  try {
    const response = await apiFetch('GSM', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GSM),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All GSMs
const getAllGSMs = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`GSM?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single GSM
const getSingleGSM = async (id: string) => {
  try {
    const response = await apiFetch(`GSM/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update GSM
const updateGSM = async (id: string, GSM: any) => {
  try {
    const response = await apiFetch(`GSM/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GSM),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete GSM
const deleteGSM = async (id: string) => {
  try {
    const response = await apiFetch(`GSM/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createGSM,
  getAllGSMs,
  getSingleGSM,
  updateGSM,
  deleteGSM,
};