import apiFetch from "@/components/utils/fetchInstance";

// Final-create
const createFinal = async (Final: any) => {
  try {
    const response = await apiFetch('Final', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Final),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Final-list
const getAllFinal = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Final?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Final-data
const getSingleFinal = async (id: string) => {
  try {
    const response = await apiFetch(`Final/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Final-update
const updateFinal = async (id: string, employee: any) => {
  try {
    const response = await apiFetch(`Final/${id}`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(employee),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Final-data
const deleteFinal = async (id: string) => {
  try {
    const response = await apiFetch(`Final/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createFinal, getAllFinal, getSingleFinal, updateFinal, deleteFinal};