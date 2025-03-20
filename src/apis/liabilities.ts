
import apiFetch from "@/components/utils/fetchInstance";

// Create Liabilities
const createLiabilities = async (Liabilities: any) => {
  try {
    const response = await apiFetch('Liabilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Liabilities),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Liabilitiess
const getAllLiabilities = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Liabilities?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Liabilities
const getSingleLiabilities = async (id: string) => {
  try {
    const response = await apiFetch(`Liabilities/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Liabilities
const updateLiabilities = async (id: string, Liabilities: any) => {
  try {
    const response = await apiFetch(`Liabilities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Liabilities),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Liabilities
const deleteLiabilities = async (id: string) => {
  try {
    const response = await apiFetch(`Liabilities/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createLiabilities,
  getAllLiabilities,
  getSingleLiabilities,
  updateLiabilities,
  deleteLiabilities,
};