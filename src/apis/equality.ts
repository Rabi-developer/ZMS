
import apiFetch from "@/components/utils/fetchInstance";

// Create Equality
const createEquality = async (Equality: any) => {
  try {
    const response = await apiFetch('Equality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Equality),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Equalitys
const getAllEquality = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    
    // Add search query if provided
    if (filters.searchQuery) {
      queryParams += `&SearchQuery=${encodeURIComponent(filters.searchQuery)}`;
    }
    
    const response = await apiFetch(`Equality?${queryParams}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Equality
const getSingleEquality = async (id: string) => {
  try {
    const response = await apiFetch(`Equality/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Equality
const updateEquality = async (id: string, Equality: any) => {
  try {
    const response = await apiFetch(`Equality`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Equality),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteEquality = async (id: string) => {
  try {
    const response = await apiFetch(`Equality/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createEquality,
  getAllEquality,
  getSingleEquality,
  updateEquality,
  deleteEquality,
};