import apiFetch from "@/components/utils/fetchInstance";

// EmployeeManagement-create
const createEmployeeManagement = async (employeemanagement: any) => {
  try {
    const response = await apiFetch('EmployeeManagement', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(employeemanagement),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// EmployeeManagement-list
const getAllEmployeeManagement = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`EmployeeManagement?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-EmployeeManagement-data
const getSingleEmployeeManagement = async (id: string) => {
  try {
    const response = await apiFetch(`EmployeeManagement/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// EmployeeManagement-update
const updateEmployeeManagement = async (id: string, employee: any) => {
  try {
    const response = await apiFetch(`EmployeeManagement/${id}`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(employee),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-EmployeeManagement-data
const deleteEmployeeManagement = async (id: string) => {
  try {
    const response = await apiFetch(`EmployeeManagement/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createEmployeeManagement, getAllEmployeeManagement, getSingleEmployeeManagement, updateEmployeeManagement, deleteEmployeeManagement };