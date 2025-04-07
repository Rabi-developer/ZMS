import apiFetch from "@/components/utils/fetchInstance";

// BlendRatio-create
const createBlendRatio = async (BlendRatio: any) => {
  try {
    const response = await apiFetch('BlendRatio', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BlendRatio),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BlendRatio-list
const getAllBlendRatios = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`BlendRatio?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BlendRatio-data
const getSingleBlendRatio = async (id: string) => {
  try {
    const response = await apiFetch(`BlendRatio/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BlendRatio-update
const updateBlendRatio = async (id: string, BlendRatio: any) => {
  try {
    const response = await apiFetch(`BlendRatio`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BlendRatio),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BlendRatio-data
const deleteBlendRatio = async (id: string) => {
  try {
    const response = await apiFetch(`BlendRatio/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createBlendRatio, getAllBlendRatios, getSingleBlendRatio, updateBlendRatio, deleteBlendRatio };
