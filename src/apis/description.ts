import apiFetch from "@/components/utils/fetchInstance";

// Description-create
const createDescription = async (Description: any) => {
  try {
    const response = await apiFetch('Description', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Description),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Description-list
const getAllDescriptions = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Description?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Description-data
const getSingleDescription = async (id: string) => {
  try {
    const response = await apiFetch(`Description/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Description-update
const updateDescription = async (id: string, Description: any) => {
  try {
    const response = await apiFetch(`Description`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Description),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Description-data
const deleteDescription = async (id: string) => {
  try {
    const response = await apiFetch(`Description/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createDescription, getAllDescriptions, getSingleDescription, updateDescription, deleteDescription };
