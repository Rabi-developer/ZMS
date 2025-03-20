import apiFetch from "@/components/utils/fetchInstance";

// warehouse-create
const createWarehouse = async (warehouse: any) => {
  try {
    const response = await apiFetch('Warehouse', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(warehouse),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// warehouse-list
const getAllWarehouse = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Warehouse?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-warehouse-data
const getSingleWarehouse = async (id: string) => {
  try {
    const response = await apiFetch(`Warehouse/${id}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// warehouse-update
const updateWarehouse = async (id: string, warehouse: any) => {
  try {
    const response = await apiFetch(`Warehouse`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(warehouse),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-warehouse-data
const deleteWarehouse = async (id: string) => {
  try {
    const response = await apiFetch(`Warehouse/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createWarehouse, getAllWarehouse, getSingleWarehouse, updateWarehouse, deleteWarehouse };
