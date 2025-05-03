import apiFetch from "@/components/utils/fetchInstance";

const createCommissionType = async (CommissionType: any) => {
  try {
    const response = await apiFetch('CommissionType', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CommissionType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllCommissionTypes = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`CommissionType?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleCommissionType = async (id: string) => {
  try {
    const response = await apiFetch(`CommissionType/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateCommissionType = async (id: string, CommissionType: any) => {
  try {
    const response = await apiFetch(`CommissionType`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CommissionType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteCommissionType = async (id: string) => {
  try {
    const response = await apiFetch(`CommissionType/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createCommissionType,
  getAllCommissionTypes,
  getSingleCommissionType,
  updateCommissionType,
  deleteCommissionType,
};