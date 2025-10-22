
import apiFetch from "@/components/utils/fetchInstance";

// Create AblAssests
const createAblAssests = async (AblAssests: any) => {
  try {
    const response = await apiFetch('AblAssests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblAssests),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};


// Get All AblAssestss
const getAllAblAssests = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AblAssests?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single AblAssests
const getSingleAblAssests = async (id: string) => {
  try {
    const response = await apiFetch(`AblAssests/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update AblAssests
const updateAblAssests = async (id: string, AblAssests: any) => {
  try {
    const response = await apiFetch(`AblAssests`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblAssests),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteAblAssests = async (id: string) => {
  try {
    const response = await apiFetch(`AblAssests/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAblAssests,
  getAllAblAssests,
  getSingleAblAssests,
  updateAblAssests,
  deleteAblAssests,
};