
import apiFetch from "@/components/utils/fetchInstance";

// Create Stuff
const createStuff = async (Stuff: any) => {
  try {
    const response = await apiFetch('Stuff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Stuff),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Stuffs
const getAllStuffs = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Stuff?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Stuff
const getSingleStuff = async (id: string) => {
  try {
    const response = await apiFetch(`Stuff/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Stuff
const updateStuff = async (id: string, Stuff: any) => {
  try {
    const response = await apiFetch(`Stuff/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Stuff),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Stuff
const deleteStuff = async (id: string) => {
  try {
    const response = await apiFetch(`Stuff/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createStuff,
  getAllStuffs,
  getSingleStuff,
  updateStuff,
  deleteStuff,
};