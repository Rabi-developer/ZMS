import apiFetch from "@/components/utils/fetchInstance";

// Weaves-create
const createWeaves= async (Weaves: any) => {
  try {
    const response = await apiFetch('Weaves', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Weaves),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Weaves-list
const getAllWeaves= async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Weaves?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Weaves-data
const getSingleWeaves= async (id: string) => {
  try {
    const response = await apiFetch(`Weaves/${id}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Weaves-update
const updateWeaves= async (id: string, Weaves: any) => {
  try {
    const response = await apiFetch(`Weaves`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(Weaves),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Weaves-data
const deleteWeaves= async (id: string) => {
  try {
    const response = await apiFetch(`Weaves/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createWeaves, getAllWeaves, getSingleWeaves, updateWeaves, deleteWeaves};
