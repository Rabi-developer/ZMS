
import apiFetch from "@/components/utils/fetchInstance";

// Create AdminSellingExp
const createAdminSellingExp = async (AdminSellingExp: any) => {
  try {
    const response = await apiFetch('AdminSellingExp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AdminSellingExp),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All AdminSellingExps
const getAllAdminSellingExp = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AdminSellingExp?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single AdminSellingExp
const getSingleAdminSellingExp = async (id: string) => {
  try {
    const response = await apiFetch(`AdminSellingExp/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update AdminSellingExp
const updateAdminSellingExp = async (id: string, AdminSellingExp: any) => {
  try {
    const response = await apiFetch(`AdminSellingExp/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AdminSellingExp),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete AdminSellingExp
const deleteAdminSellingExp = async (id: string) => {
  try {
    const response = await apiFetch(`AdminSellingExp/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createAdminSellingExp,
  getAllAdminSellingExp,
  getSingleAdminSellingExp,
  updateAdminSellingExp,
  deleteAdminSellingExp,
};