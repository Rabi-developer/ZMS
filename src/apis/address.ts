import apiFetch from "@/components/utils/fetchInstance";

// Address-create
const createAddress = async (address: any) => {
  try {
    const response = await apiFetch('Address', {
      method: 'POST',
      headers: {},
      body: JSON.stringify(address),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Address-list
const getAllAddress = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Address?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Address-data
const getSingleAddress = async (id: string) => {
  try {
    const response = await apiFetch(`Address/${id}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Address-update
const updateAddress = async (id: string, address: any) => {
  try {
    const response = await apiFetch(`Address`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(address),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Address-data
const deleteAddress = async (id: string) => {
  try {
    const response = await apiFetch(`Address/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createAddress, getAllAddress, getSingleAddress, updateAddress, deleteAddress };
