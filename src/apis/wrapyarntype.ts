import apiFetch from "@/components/utils/fetchInstance";

// WrapYarnType-create
const createWrapYarnType = async (WrapYarnType: any) => {
  try {
    const response = await apiFetch('WrapYarnType', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(WrapYarnType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// WrapYarnType-list
const getAllWrapYarnTypes = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`WrapYarnType?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-WrapYarnType-data
const getSingleWrapYarnType = async (id: string) => {
  try {
    const response = await apiFetch(`WrapYarnType/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// WrapYarnType-update
const updateWrapYarnType = async (id: string, WrapYarnType: any) => {
  try {
    const response = await apiFetch(`WrapYarnType`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(WrapYarnType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-WrapYarnType-data
const deleteWrapYarnType = async (id: string) => {
  try {
    const response = await apiFetch(`WrapYarnType/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createWrapYarnType, getAllWrapYarnTypes, getSingleWrapYarnType, updateWrapYarnType, deleteWrapYarnType };
