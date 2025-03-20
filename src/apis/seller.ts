
import apiFetch from "@/components/utils/fetchInstance";

// Create Seller
const createSeller = async (Seller: any) => {
  try {
    const response = await apiFetch('Seller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Seller),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Sellers
const getAllSellers = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Seller?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Seller
const getSingleSeller = async (id: string) => {
  try {
    const response = await apiFetch(`Seller/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Seller
const updateSeller = async (id: string, Seller: any) => {
  try {
    const response = await apiFetch(`Seller/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Seller),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Seller
const deleteSeller = async (id: string) => {
  try {
    const response = await apiFetch(`Seller/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSeller,
  getAllSellers,
  getSingleSeller,
  updateSeller,
  deleteSeller,
};