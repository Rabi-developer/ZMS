import apiFetch from "@/components/utils/fetchInstance";

// BookingOrder-create
const createBookingOrder = async (BookingOrder : any) => {
  try {
    const response = await apiFetch('BookingOrder', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BookingOrder),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BookingOrder-list
const getAllBookingOrder  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`BookingOrder?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBookingOrderPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BookingOrderPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BookingOrder-data
const getSingleBookingOrder  = async (id: string) => {
  try {
    const response = await apiFetch(`BookingOrder/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBookingOrder = async (BookingOrder: any, data: { orderDate: string; transporter: string; vendor: string; vehicleNo: string; vehicleType: string; driverName: string; cargoWeight: string; fromLocation: string; toLocation: string; orderNo?: string | undefined; containerNo?: string | undefined; remarks?: string | undefined; contactNo?: string | undefined; munshayana?: string | undefined; bookedDays?: string | undefined; detentionDays?: string | undefined; departureDate?: string | undefined; via1?: string | undefined; via2?: string | undefined; expectedReachedDate?: string | undefined; reachedDate?: string | undefined; vehicleMunshyana?: string | undefined; contractOwner?: string | undefined; }) => {
  try {
    const response = await apiFetch(`BookingOrder`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BookingOrder),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BookingOrder-data
const deleteBookingOrder  = async (id: string) => {
  try {
    const response = await apiFetch(`BookingOrder/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateBookingOrderStatus = async (BookingOrderStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BookingOrder/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BookingOrderStatus.id, Status: BookingOrderStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createBookingOrder , getAllBookingOrder , getAllBookingOrderPositions , getSingleBookingOrder , updateBookingOrder , deleteBookingOrder, updateBookingOrderStatus  };
