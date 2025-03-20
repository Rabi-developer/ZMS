import apiFetch from "@/components/utils/fetchInstance";

// Create Customer
const createCustomer = async (customer: any) => {
  try {
    const response = await apiFetch('Customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Customers
const getAllCustomers = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Customer?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Customer
const getSingleCustomer = async (id: string) => {
  try {
    const response = await apiFetch(`Customer/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Customer
const updateCustomer = async (id: string, customer: any) => {
  try {
    const response = await apiFetch(`Customer/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Customer
const deleteCustomer = async (id: string) => {
  try {
    const response = await apiFetch(`Customer/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createCustomer,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
};