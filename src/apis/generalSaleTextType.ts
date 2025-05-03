import apiFetch from "@/components/utils/fetchInstance";

// GeneralSaleTextType-create
const createGeneralSaleTextType = async (GeneralSaleTextType: any) => {
  try {
    const response = await apiFetch('GeneralSaleTextType', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(GeneralSaleTextType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// GeneralSaleTextType-list
const getAllGeneralSaleTextTypes = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`GeneralSaleTextType?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-GeneralSaleTextType-data
const getSingleGeneralSaleTextType = async (id: string) => {
  try {
    const response = await apiFetch(`GeneralSaleTextType/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// GeneralSaleTextType-update
const updateGeneralSaleTextType = async (id: string, employee: any) => {
  try {
    const response = await apiFetch(`GeneralSaleTextType/${id}`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(employee),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-GeneralSaleTextType-data
const deleteGeneralSaleTextType = async (id: string) => {
  try {
    const response = await apiFetch(`GeneralSaleTextType/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createGeneralSaleTextType, getAllGeneralSaleTextTypes, getSingleGeneralSaleTextType, updateGeneralSaleTextType, deleteGeneralSaleTextType};