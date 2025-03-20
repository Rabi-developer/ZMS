
import apiFetch from "@/components/utils/fetchInstance";

// Create CapitalAccount
const createCapitalAccount = async (CapitalAccount: any) => {
  try {
    const response = await apiFetch('CapitalAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CapitalAccount),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All CapitalAccounts
const getAllCapitalAccount = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`CapitalAccount?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single CapitalAccount
const getSingleCapitalAccount = async (id: string) => {
  try {
    const response = await apiFetch(`CapitalAccount/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update CapitalAccount
const updateCapitalAccount = async (id: string, CapitalAccount: any) => {
  try {
    const response = await apiFetch(`CapitalAccount/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CapitalAccount),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete CapitalAccount
const deleteCapitalAccount = async (id: string) => {
  try {
    const response = await apiFetch(`CapitalAccount/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createCapitalAccount,
  getAllCapitalAccount,
  getSingleCapitalAccount,
  updateCapitalAccount,
  deleteCapitalAccount,
};