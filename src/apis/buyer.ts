
import apiFetch from "@/components/utils/fetchInstance";

// Create Buyer
const createBuyer = async (Buyer: any) => {
  try {
    const response = await apiFetch('Buyer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Buyer),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Buyers
const getAllBuyer = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Buyer?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Buyer
const getSingleBuyer = async (id: string) => {
  try {
    const response = await apiFetch(`Buyer/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Buyer
const updateBuyer = async (id: string, Buyer: any) => {
  try {
    const response = await apiFetch(`Buyer/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Buyer),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Buyer
const deleteBuyer = async (id: string) => {
  try {
    const response = await apiFetch(`Buyer/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createBuyer,
  getAllBuyer,
  getSingleBuyer,
  updateBuyer,
  deleteBuyer,
};