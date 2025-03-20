import apiFetch from "@/components/utils/fetchInstance";

// Create Supplier
const createSupplier = async (supplier: any) => {
  try {
    const response = await apiFetch('Supplier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supplier),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Suppliers
const getAllSuppliers = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Supplier?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Supplier
const getSingleSupplier = async (id: string) => {
  try {
    const response = await apiFetch(`Supplier/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Supplier
const updateSupplier = async (id: string, supplier: any) => {
  try {
    const response = await apiFetch(`Supplier/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supplier),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Supplier
const deleteSupplier = async (id: string) => {
  try {
    const response = await apiFetch(`Supplier/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createSupplier,
  getAllSuppliers,
  getSingleSupplier,
  updateSupplier,
  deleteSupplier,
};