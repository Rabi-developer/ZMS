
import apiFetch from "@/components/utils/fetchInstance";

// Create Selvege
const createSelvege = async (Selvege: any) => {
  try {
    const response = await apiFetch('Selvege', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Selvege),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Selveges
const getAllSelveges = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Selvege?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Selvege
const getSingleSelvege = async (id: string) => {
  try {
    const response = await apiFetch(`Selvege/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Selvege
const updateSelvege = async (id: string, Selvege: any) => {
  try {
    const response = await apiFetch(`Selvege/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Selvege),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Selvege
const deleteSelvege = async (id: string) => {
  try {
    const response = await apiFetch(`Selvege/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSelvege,
  getAllSelveges,
  getSingleSelvege,
  updateSelvege,
  deleteSelvege,
};