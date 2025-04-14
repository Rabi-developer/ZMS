
import apiFetch from "@/components/utils/fetchInstance";

// Create EndUse
const createEndUse = async (EndUse: any) => {
  try {
    const response = await apiFetch('EndUse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(EndUse),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All EndUses
const getAllEndUses = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`EndUse?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single EndUse
const getSingleEndUse = async (id: string) => {
  try {
    const response = await apiFetch(`EndUse/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update EndUse
const updateEndUse = async (id: string, EndUse: any) => {
  try {
    const response = await apiFetch(`EndUse/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(EndUse),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete EndUse
const deleteEndUse = async (id: string) => {
  try {
    const response = await apiFetch(`EndUse/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createEndUse,
  getAllEndUses,
  getSingleEndUse,
  updateEndUse,
  deleteEndUse,
};