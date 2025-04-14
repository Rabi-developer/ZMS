
import apiFetch from "@/components/utils/fetchInstance";

// Create Packing
const createPacking = async (Packing: any) => {
  try {
    const response = await apiFetch('Packing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Packing),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Packings
const getAllPackings = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Packing?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Packing
const getSinglePacking = async (id: string) => {
  try {
    const response = await apiFetch(`Packing/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Packing
const updatePacking = async (id: string, Packing: any) => {
  try {
    const response = await apiFetch(`Packing/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Packing),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Packing
const deletePacking = async (id: string) => {
  try {
    const response = await apiFetch(`Packing/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createPacking,
  getAllPackings,
  getSinglePacking,
  updatePacking,
  deletePacking,
};