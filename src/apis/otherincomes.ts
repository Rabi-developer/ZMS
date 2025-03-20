
import apiFetch from "@/components/utils/fetchInstance";

// Create OtherIncomes
const createOtherIncomes = async (OtherIncomes: any) => {
  try {
    const response = await apiFetch('OtherIncomes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(OtherIncomes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All OtherIncomess
const getAllOtherIncomes = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`OtherIncomes?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single OtherIncomes
const getSingleOtherIncomes = async (id: string) => {
  try {
    const response = await apiFetch(`OtherIncomes/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update OtherIncomes
const updateOtherIncomes = async (id: string, OtherIncomes: any) => {
  try {
    const response = await apiFetch(`OtherIncomes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(OtherIncomes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete OtherIncomes
const deleteOtherIncomes = async (id: string) => {
  try {
    const response = await apiFetch(`OtherIncomes/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createOtherIncomes,
  getAllOtherIncomes,
  getSingleOtherIncomes,
  updateOtherIncomes,
  deleteOtherIncomes,
};