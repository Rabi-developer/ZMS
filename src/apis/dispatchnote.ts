import apiFetch from "@/components/utils/fetchInstance";

// Create DispatchNote
const createDispatchNote = async (DispatchNote: any) => {
  try {
    const response = await apiFetch('DispatchNote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DispatchNote),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All DispatchNotes
const getAllDispatchNotes = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`DispatchNote?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single DispatchNote
const getSingleDispatchNote = async (id: string) => {
  try {
    const response = await apiFetch(`DispatchNote/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update DispatchNote
const updateDispatchNote = async (id: string, DispatchNote: any) => {
  try {
    const response = await apiFetch(`DispatchNote/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DispatchNote),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete DispatchNote
const deleteDispatchNote = async (id: string) => {
  try {
    const response = await apiFetch(`DispatchNote/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createDispatchNote,
  getAllDispatchNotes,
  getSingleDispatchNote,
  updateDispatchNote,
  deleteDispatchNote,
};