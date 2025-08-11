
import apiFetch from "@/components/utils/fetchInstance";

// Create AblLiabilities
const createAblLiabilities = async (AblLiabilities: any) => {
  try {
    const response = await apiFetch('AblLiabilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblLiabilities),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All AblLiabilitiess
const getAllAblLiabilities = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AblLiabilities?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single AblLiabilities
const getSingleAblLiabilities = async (id: string) => {
  try {
    const response = await apiFetch(`AblLiabilities/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update AblLiabilities
const updateAblLiabilities = async (id: string, AblLiabilities: any) => {
  try {
    const response = await apiFetch(`AblLiabilities`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblLiabilities),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteAblLiabilities = async (id: string) => {
  try {
    const response = await apiFetch(`AblLiabilities/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAblLiabilities,
  getAllAblLiabilities,
  getSingleAblLiabilities,
  updateAblLiabilities,
  deleteAblLiabilities,
};