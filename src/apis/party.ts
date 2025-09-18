
import apiFetch from "@/components/utils/fetchInstance";

// Create Party
const createParty = async (Party: any) => {
  try {
    const response = await apiFetch('Party', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Party),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Partys
const getAllPartys = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Party?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Party
const getSingleParty = async (id: string) => {
  try {
    const response = await apiFetch(`Party/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Party
// Update Party
const updateParty = async (id: string, Party: any) => {
  try {
    const response = await apiFetch(`Party/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Party),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Party
const deleteParty = async (id: string) => {
  try {
    const response = await apiFetch(`Party`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createParty,
  getAllPartys,
  getSingleParty,
  updateParty,
  deleteParty,
};