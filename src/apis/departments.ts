import apiFetch from "@/components/utils/fetchInstance";

// Department-create
const createDepartment = async (department: any) => {
  try {
    const response = await apiFetch('Department', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(department),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Department-list
const getAllDepartment = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Department?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Department-data
const getSingleDepartment = async (id: string) => {
  try {
    const response = await apiFetch(`Department/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Department-update
const updateDepartment = async (id: string, department: any) => {
  try {
    const response = await apiFetch(`Department`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(department),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Department-data
const deleteDepartment = async (id: string) => {
  try {
    const response = await apiFetch(`Department/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createDepartment, getAllDepartment, getSingleDepartment, updateDepartment, deleteDepartment };
