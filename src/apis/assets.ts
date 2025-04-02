
import apiFetch from "@/components/utils/fetchInstance";

// Create Assets
const createAssets = async (Assets: any) => {
  try {
    const response = await apiFetch('Assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Assets),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Assetss
const getAllAssets = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Assets?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Assets
const getSingleAssets = async (id: string) => {
  try {
    const response = await apiFetch(`Assets/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Assets
const updateAssets = async (id: string, Assets: any) => {
  try {
    const response = await apiFetch(`Assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Assets),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Assets
const deleteAssets = async (id: string) => {
  try {
    const response = await apiFetch(`Assets/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAssets,
  getAllAssets,
  getSingleAssets,
  updateAssets,
  deleteAssets,
};