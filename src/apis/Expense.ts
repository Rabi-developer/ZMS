
import apiFetch from "@/components/utils/fetchInstance";

// Create Expense
const createExpense = async (Expense: any) => {
  try {
    const response = await apiFetch('Expense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Expense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Expenses
const getAllExpense = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Expense?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Expense
const getSingleExpense = async (id: string) => {
  try {
    const response = await apiFetch(`Expense/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Expense
const updateExpense = async (id: string, Expense: any) => {
  try {
    const response = await apiFetch(`Expense/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Expense),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Expense
const deleteExpense = async (id: string) => {
  try {
    const response = await apiFetch(`Expense/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createExpense,
  getAllExpense,
  getSingleExpense,
  updateExpense,
  deleteExpense,
};