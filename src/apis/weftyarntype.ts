import apiFetch from "@/components/utils/fetchInstance";

// WeftYarnType-create
const createWeftYarnType= async (WeftYarnType: any) => {
  try {
    const response = await apiFetch('WeftYarnType', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(WeftYarnType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// WeftYarnType-list
const getAllWeftYarnType= async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`WeftYarnType?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-WeftYarnType-data
const getSingleWeftYarnType= async (id: string) => {
  try {
    const response = await apiFetch(`WeftYarnType/${id}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// WeftYarnType-update
const updateWeftYarnType= async (id: string, WeftYarnType: any) => {
  try {
    const response = await apiFetch(`WeftYarnType`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(WeftYarnType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-WeftYarnType-data
const deleteWeftYarnType= async (id: string) => {
  try {
    const response = await apiFetch(`WeftYarnType/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createWeftYarnType, getAllWeftYarnType, getSingleWeftYarnType, updateWeftYarnType, deleteWeftYarnType};
