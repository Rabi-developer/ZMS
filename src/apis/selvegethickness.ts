
import apiFetch from "@/components/utils/fetchInstance";

// Create SelvegeThickness
const createSelvegeThickness = async (SelvegeThickness: any) => {
  try {
    const response = await apiFetch('SelvegeThickness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeThickness),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All SelvegeThicknesss
const getAllSelvegeThicknesss = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`SelvegeThickness?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single SelvegeThickness
const getSingleSelvegeThickness = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeThickness/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update SelvegeThickness
const updateSelvegeThickness = async (id: string, SelvegeThickness: any) => {
  try {
    const response = await apiFetch(`SelvegeThickness/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeThickness),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete SelvegeThickness
const deleteSelvegeThickness = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeThickness/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSelvegeThickness,
  getAllSelvegeThicknesss,
  getSingleSelvegeThickness,
  updateSelvegeThickness,
  deleteSelvegeThickness,
};