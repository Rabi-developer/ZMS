
import apiFetch from "@/components/utils/fetchInstance";

// Create FinancialExpense
const createFinancialExpense = async (FinancialExpense: any) => {
  try {
    const response = await apiFetch('FinancialExpense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FinancialExpense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All FinancialExpenses
const getAllFinancialExpense = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`FinancialExpense?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single FinancialExpense
const getSingleFinancialExpense = async (id: string) => {
  try {
    const response = await apiFetch(`FinancialExpense/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update FinancialExpense
const updateFinancialExpense = async (id: string, FinancialExpense: any) => {
  try {
    const response = await apiFetch(`FinancialExpense/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FinancialExpense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete FinancialExpense
const deleteFinancialExpense = async (id: string) => {
  try {
    const response = await apiFetch(`FinancialExpense/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createFinancialExpense,
  getAllFinancialExpense,
  getSingleFinancialExpense,
  updateFinancialExpense,
  deleteFinancialExpense,
};