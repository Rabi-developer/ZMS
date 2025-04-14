
import apiFetch from "@/components/utils/fetchInstance";

// Create SelvegeWidth
const createSelvegeWidth = async (SelvegeWidth: any) => {
  try {
    const response = await apiFetch('SelvegeWidth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeWidth),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All SelvegeWidths
const getAllSelvegeWidths = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`SelvegeWidth?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single SelvegeWidth
const getSingleSelvegeWidth = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeWidth/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update SelvegeWidth
const updateSelvegeWidth = async (id: string, SelvegeWidth: any) => {
  try {
    const response = await apiFetch(`SelvegeWidth/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SelvegeWidth),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete SelvegeWidth
const deleteSelvegeWidth = async (id: string) => {
  try {
    const response = await apiFetch(`SelvegeWidth/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSelvegeWidth,
  getAllSelvegeWidths,
  getSingleSelvegeWidth,
  updateSelvegeWidth,
  deleteSelvegeWidth,
};