
import apiFetch from "@/components/utils/fetchInstance";

// Create SelvegeWeave
const createSelvegeWeave = async (SelvegeWeave: any) => {
  try {
    const response = await apiFetch('SelvegeWeaves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeWeave),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All SelvegeWeaves
const getAllSelvegeWeaves = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`SelvegeWeaves?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single SelvegeWeave
const getSingleSelvegeWeave = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeWeaves/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update SelvegeWeave
const updateSelvegeWeave = async (id: string, SelvegeWeave: any) => {
  try {
    const response = await apiFetch(`SelvegeWeaves/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeWeave),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete SelvegeWeave
const deleteSelvegeWeave = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeWeaves/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSelvegeWeave,
  getAllSelvegeWeaves,
  getSingleSelvegeWeave,
  updateSelvegeWeave,
  deleteSelvegeWeave,
};