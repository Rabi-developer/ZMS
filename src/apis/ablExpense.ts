
import apiFetch from "@/components/utils/fetchInstance";

// Create AblExpense
const createAblExpense = async (AblExpense: any) => {
  try {
    const response = await apiFetch('AblExpense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblExpense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All AblExpenses
const getAllAblExpense = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AblExpense?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single AblExpense
const getSingleAblExpense = async (id: string) => {
  try {
    const response = await apiFetch(`AblExpense/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update AblExpense
const updateAblExpense = async (id: string, AblExpense: any) => {
  try {
    const response = await apiFetch(`AblExpense`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AblExpense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteAblExpense = async (id: string) => {
  try {
    const response = await apiFetch(`AblExpense/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAblExpense,
  getAllAblExpense,
  getSingleAblExpense,
  updateAblExpense,
  deleteAblExpense,
};