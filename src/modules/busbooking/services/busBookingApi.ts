import { getAuthHeaders } from "../../common/auth/api/AuthAPI";
import api from "../../common/auth/api/axios";

export type City = {
  id: number | string;
  city_name: string;
  state_name?: string;
  city_type?: string;
  latitude?: string | number;
  longitude?: string | number;
};

export type BusSearchPayload = {
  sourceCityCode: string;
  destinationCityCode: string;
  journeyDate: string;
  journeyTime: string;
};

export type BusSearchResponse = {
  success: boolean;
  message: string;

  search?: {
    source: {
      code: string;
      name: string | null;
    };

    destination: {
      code: string;
      name: string | null;
    };

    journeyDate: string;
    journeyTime: string;
  };

  traceId?: string | number | null;

  totalBusesFromProvider?: number;

  count?: number;

  buses?: any[];
};

export type SeatPrice = {
  CurrencyCode?: string;
  BaseFare?: string | number;
  Tax?: string | number;
  Discount?: string | number;
  PublishedFare?: string | number;
  OfferedFare?: string | number;
  AgentCommission?: string | number;
  AgentMarkUp?: string | number;
  GstTaxableAmount?: string | number;
  GSTRate?: string | number;
  GSTAmount?: string | number;
};


export type SeatLayoutSeat = {
  ColumnNo: number;
  RowNo: number;

  IsLadiesSeat: boolean | string;
  IsMalesSeat: boolean | string;

  IsUpper: boolean | string;

  SeatName: string;

  SeatStatus: boolean | string;

  ReservedForSocialDistancing:
    boolean | string;

  DoubleBirth: boolean | string;

  SeatType: string;

  Width: string | number;

  Price?: SeatPrice;

  SeatFare?: number | string;
};


export type SeatLayoutPayload = {
  traceId: string;
  srdvIndex: string;
  resultIndex: string;
};


export type SeatLayoutResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  paxIdRequired?: string | null;

  totalSeats: number;

  availableSeats: number;

  seats: SeatLayoutSeat[];

  layout?: SeatLayoutSeat[][];
};

/*
|--------------------------------------------------------------------------
| Boarding / Dropping Point Types
|--------------------------------------------------------------------------
*/

export type BoardingDroppingPoint = {
  Id: string;

  MasterId?: string;

  Name: string;

  Location?: string;

  Address?: string;

  Landmark?: string;

  ContactNumber?: string;

  Time: string;
};


export type BoardingDroppingPayload = {
  traceId: string;

  srdvIndex: string;

  resultIndex: string;
};


export type BoardingDroppingResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  boardingPointCount?: number;

  droppingPointCount?: number;

  boardingPoints: BoardingDroppingPoint[];

  droppingPoints: BoardingDroppingPoint[];
};
/*
|--------------------------------------------------------------------------
| Block Seat Types
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Block Passenger
|--------------------------------------------------------------------------
*/

export type BlockPassenger = {

  Title:
    string;

  FirstName:
    string;

  LastName:
    string;

  Gender:
    string;

  Age:
    string;

  Email:
    string;

  PhoneNo:
    string;

  LeadPassenger:
    string;

  IdNumber:
    string;

  IdType:
    string;

  Address:
    string;

  SeatName:
    string;
};


/*
|--------------------------------------------------------------------------
| Block Payload
|--------------------------------------------------------------------------
*/

export type BlockSeatPayload = {

  traceId:
    string;

  srdvIndex:
    string;

  resultIndex:
    string;

  boardingPointId:
    string;

  droppingPointId:
    string;

  refId:
    string;

  passengers:
    BlockPassenger[];

  sourceCity?:
    string;

  destinationCity?:
    string;
};


/*
|--------------------------------------------------------------------------
| Block Response
|--------------------------------------------------------------------------
*/

export type BlockSeatResponse = {

  success:
    boolean;

  message:
    string;

  traceId:
    string;

  srdvIndex:
    string;

  resultIndex:
    string;

  blockKey:
    string;

  /*
  |--------------------------------------------------------------------------
  | Our Local Booking
  |--------------------------------------------------------------------------
  */

  localOrderId:
    number;

  orderRef:
    string;

  payableAmount:
    number;

  /*
  |--------------------------------------------------------------------------
  | Provider Data
  |--------------------------------------------------------------------------
  */

  bus?: {

    travelsName?:
      string | null;

    busType?:
      string | null;

    departureTime?:
      string | null;

    arrivalTime?:
      string | null;

    duration?:
      number | null;

    price?:
      any;
  };

  boardingPoint?:
    any;

  droppingPoint?:
    any;

  cancellationPolicy?:
    any[];

  passengers?:
    any[];
};

/*
|--------------------------------------------------------------------------
| Book Bus Ticket Types
|--------------------------------------------------------------------------
*/

export type BookBusPayload = {
  traceId: string;
  srdvIndex: string;
  resultIndex: string;
};


export type BookBusResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  bookingId: number | string;

  bookingStatus: string;

  ticketNo: string;

  travelOperatorPNR: string;
};

/*
|--------------------------------------------------------------------------
| Bus Razorpay Create Order
|--------------------------------------------------------------------------
*/

export type CreateBusPaymentOrderPayload = {

  order_ref:
    string;
};


export type CreateBusPaymentOrderResponse = {

  success:
    boolean;

  reused?:
    boolean;

  message?:
    string;

  data: {

    key:
      string;

    orderId:
      string;

    /*
    | Razorpay amount is in paise.
    */
    amount:
      number;

    currency:
      string;

    order_ref:
      string;
  };
};

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
|
| Physical Android phone:
| Use your computer's LAN IP.
|
| Example:
| http://192.168.1.100:5000
|
| Android Emulator:
| http://10.0.2.2:5000
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| LOCAL BUS BOOKING BACKEND
|--------------------------------------------------------------------------
|
| Android Emulator:
| http://10.0.2.2:5000/api/busbooking
|
| Physical Android phone:
| http://YOUR_PC_LAN_IP:5000/api/busbooking
| Example:
| http://192.168.1.100:5000/api/busbooking
|
| USB-connected Android phone with adb reverse:
| http://localhost:5000
|
| Update this one constant when you want to point bus booking to a local
| backend instead of the live server.
|
|--------------------------------------------------------------------------
*/
export const BUS_BOOKING_BASE_URL = "http://localhost:5000";


/*
|--------------------------------------------------------------------------
| Search Cities
|--------------------------------------------------------------------------
*/

export const searchCitiesApi = async (
  query: string
): Promise<City[]> => {
  const authHeaders = await getAuthHeaders();
  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/cities?q=${encodeURIComponent(query)}`;

  console.log("[BusBooking][API][Cities] Request", {
    query,
    requestUrl,
    hasAuthorization: !!authHeaders.Authorization,
  });

  let response: Response;
  let result: any;

  try {
    response = await fetch(
      requestUrl,
      {
        headers: {
          ...authHeaders,
        },
      }
    );

    result = await response.json();
  } catch (error: any) {
    console.log("[BusBooking][API][Cities] Network Error", {
      query,
      requestUrl,
      message: error?.message || error,
    });

    throw new Error(
      "Network request failed. Check whether your local backend is running on http://localhost:5000 or adb reverse is missing"
    );
  }

  console.log("[BusBooking][API][Cities] Response", {
    ok: response.ok,
    status: response.status,
    result,
  });

  if (!response.ok || !result.success) {
    console.log("[BusBooking][API][Cities] Error", {
      query,
      status: response.status,
      message: result.message,
    });
    throw new Error(
      result.message || "Unable to search cities"
    );
  }

  return result.data || [];
};


/*
|--------------------------------------------------------------------------
| Search Buses
|--------------------------------------------------------------------------
*/

export const searchBusesApi = async (
  payload: BusSearchPayload
): Promise<BusSearchResponse> => {
  const authHeaders = await getAuthHeaders();
  const requestUrl = `${BUS_BOOKING_BASE_URL}/api/busbooking/search`;

  console.log("[BusBooking][API][Search] Request", {
    
    requestUrl,
    payload,
    hasAuthorization: !!authHeaders.Authorization,
  });

  let response: Response;
  let result: any;

  try {
    response = await fetch(
      requestUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },

        body: JSON.stringify(payload),
      }
    );

    result = await response.json();
  } catch (error: any) {
    console.log("[BusBooking][API][Search] Network Error", {
      requestUrl,
      payload,
      message: error?.message || error,
    });

    throw new Error(
      "Network request failed. Check whether your local backend is running on http://localhost:5000 or adb reverse is missing"
    );
  }

  console.log("[BusBooking][API][Search] Response", {
    ok: response.ok,
    status: response.status,
    busCount: Array.isArray(result?.buses) ? result.buses.length : 0,
    result,
  });

  if (!response.ok || !result.success) {
    console.log("[BusBooking][API][Search] Error", {
      status: response.status,
      payload,
      message: result.message,
      result,
    });

    throw new Error(
      result.message ||
      "Unable to search buses"
    );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Get Seat Layout
|--------------------------------------------------------------------------
*/

export const getSeatLayoutApi = async (
  payload: SeatLayoutPayload
): Promise<SeatLayoutResponse> => {

  const authHeaders =
    await getAuthHeaders();

  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/seat-layout`;


  console.log(
    "[BusBooking][API][SeatLayout] Request",
    {
      requestUrl,
      payload,
      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );


  let response: Response;
  let result: any;


  try {

    response = await fetch(
      requestUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...authHeaders,
        },

        body:
          JSON.stringify(payload),
      }
    );


    result =
      await response.json();


  } catch (error: any) {

    console.log(
      "[BusBooking][API][SeatLayout] Network Error",
      {
        requestUrl,
        payload,
        message:
          error?.message || error,
      }
    );


    throw new Error(
      "Network request failed while fetching seat layout"
    );
  }


  console.log(
    "[BusBooking][API][SeatLayout] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      totalSeats:
        result?.totalSeats,

      availableSeats:
        result?.availableSeats,

      result,
    }
  );


  if (
    !response.ok ||
    !result.success
  ) {

    console.log(
      "[BusBooking][API][SeatLayout] Error",
      {
        status:
          response.status,

        payload,

        message:
          result?.message,

        result,
      }
    );


    throw new Error(
      result?.message ||
      "Unable to get seat layout"
    );
  }


  return result;
};

/*
|--------------------------------------------------------------------------
| Get Boarding / Dropping Points
|--------------------------------------------------------------------------
*/

export const getBoardingDroppingPointsApi = async (
  payload: BoardingDroppingPayload
): Promise<BoardingDroppingResponse> => {

  const authHeaders =
    await getAuthHeaders();


  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/boarding-dropping-points`;


  console.log(
    "[BusBooking][API][BoardingDropping] Request",
    {
      requestUrl,
      payload,

      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );


  let response: Response;

  let result: any;


  try {

    response =
      await fetch(
        requestUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...authHeaders,
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );


    result =
      await response.json();

  } catch (error: any) {

    console.log(
      "[BusBooking][API][BoardingDropping] Network Error",
      {
        requestUrl,

        payload,

        message:
          error?.message ||
          error,
      }
    );


    throw new Error(
      "Network request failed while fetching boarding and dropping points"
    );
  }


  console.log(
    "[BusBooking][API][BoardingDropping] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      boardingPointCount:
        result?.boardingPoints?.length || 0,

      droppingPointCount:
        result?.droppingPoints?.length || 0,

      result,
    }
  );


  if (
    !response.ok ||
    !result.success
  ) {

    console.log(
      "[BusBooking][API][BoardingDropping] Error",
      {
        status:
          response.status,

        payload,

        message:
          result?.message,

        result,
      }
    );


    throw new Error(
      result?.message ||
      "Unable to get boarding and dropping points"
    );
  }


  return result;
};

/*
|--------------------------------------------------------------------------
| Block Seat
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Block Seat
|--------------------------------------------------------------------------
*/

export const blockSeatApi =
  async (
    payload:
      BlockSeatPayload
  ): Promise<
    BlockSeatResponse
  > => {

    const authHeaders =
      await getAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/api/busbooking/block`;


    console.log(
      "[BusBooking][API][Block] Request",
      {

        requestUrl,

        traceId:
          payload.traceId,

        srdvIndex:
          payload.srdvIndex,

        resultIndex:
          payload.resultIndex,

        boardingPointId:
          payload.boardingPointId,

        droppingPointId:
          payload.droppingPointId,

        sourceCity:
          payload.sourceCity,

        destinationCity:
          payload.destinationCity,

        passengerCount:
          payload
            .passengers
            .length,

        hasAuthorization:
          !!authHeaders
            .Authorization,
      }
    );


    let response:
      any;


    let result:
      any;


    try {

      response =
        await fetch(
          requestUrl,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              ...authHeaders,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );


      result =
        await response.json();


    } catch (
      error: any
    ) {

      console.log(
        "[BusBooking][API][Block] Network Error",
        error
      );


      throw new Error(
        "Network request failed while blocking bus seat"
      );
    }


    console.log(
      "[BusBooking][API][Block] Response",
      {

        ok:
          response.ok,

        status:
          response.status,

        success:
          result?.success,

        blockKey:
          result?.blockKey,

        localOrderId:
          result?.localOrderId,

        orderRef:
          result?.orderRef,

        payableAmount:
          result?.payableAmount,

        message:
          result?.message,
      }
    );


    /*
    |--------------------------------------------------------------------------
    | Authentication Failure
    |--------------------------------------------------------------------------
    */

    if (
      response.status ===
      401
    ) {

      throw new Error(
        result?.message ||
        "Your login session has expired. Please login again."
      );
    }


    if (
      !response.ok ||
      !result?.success
    ) {

      throw new Error(
        result?.message ||
        "Unable to block selected seat"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Local Order Must Exist
    |--------------------------------------------------------------------------
    */

    if (
      !result
        ?.orderRef
    ) {

      throw new Error(
        "Seat was blocked but local booking order was not created"
      );
    }


    if (
      !result
        ?.localOrderId
    ) {

      throw new Error(
        "Local bus booking order ID is missing"
      );
    }


    if (
      Number(
        result
          ?.payableAmount ||
        0
      ) <=
      0
    ) {

      throw new Error(
        "Booking amount is missing from Block response"
      );
    }


    return result;
  };
/*
|--------------------------------------------------------------------------
| Book Bus Ticket
|--------------------------------------------------------------------------
*/

export const bookBusTicketApi = async (
  payload: BookBusPayload
): Promise<BookBusResponse> => {

  /*
  |--------------------------------------------------------------------------
  | Auth Headers
  |--------------------------------------------------------------------------
  */

  const authHeaders =
    await getAuthHeaders();


  /*
  |--------------------------------------------------------------------------
  | Backend URL
  |--------------------------------------------------------------------------
  */

  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/book`;


  /*
  |--------------------------------------------------------------------------
  | Request Log
  |--------------------------------------------------------------------------
  */

  console.log(
    "======================================"
  );

  console.log(
    "[BusBooking][API][Book] Request",
    {
      requestUrl,

      traceId:
        payload.traceId,

      srdvIndex:
        payload.srdvIndex,

      resultIndex:
        payload.resultIndex,

      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );

  console.log(
    "======================================"
  );


  let response: Response;

  let result: any;


  /*
  |--------------------------------------------------------------------------
  | API Call
  |--------------------------------------------------------------------------
  */

  try {

    response =
      await fetch(
        requestUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...authHeaders,
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );


    result =
      await response.json();


  } catch (
    error: any
  ) {

    console.log(
      "[BusBooking][API][Book] Network Error",
      {
        requestUrl,

        message:
          error?.message ||
          error,
      }
    );


    throw new Error(
      "Network request failed while booking bus ticket"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Response Log
  |--------------------------------------------------------------------------
  */

  console.log(
    "======================================"
  );

  console.log(
    "[BusBooking][API][Book] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      success:
        result?.success,

      bookingId:
        result?.bookingId,

      bookingStatus:
        result?.bookingStatus,

      ticketNo:
        result?.ticketNo,

      travelOperatorPNR:
        result?.travelOperatorPNR,

      message:
        result?.message,
    }
  );

  console.log(
    "======================================"
  );


  /*
  |--------------------------------------------------------------------------
  | Error Handling
  |--------------------------------------------------------------------------
  */

  if (
    !response.ok ||
    !result?.success
  ) {

    console.log(
      "[BusBooking][API][Book] Error",
      result
    );


    throw new Error(
      result?.message ||
      "Unable to book bus ticket"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  return result;
};

/*
|--------------------------------------------------------------------------
| Create Bus Razorpay Order
|--------------------------------------------------------------------------
*/

export const createBusPaymentOrderApi =
  async (
    payload:
      CreateBusPaymentOrderPayload
  ): Promise<
    CreateBusPaymentOrderResponse
  > => {

    const authHeaders =
      await getAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/api/busbooking/create-order`;


    const orderRef =
      String(
        payload
          ?.order_ref ||
        ""
      ).trim();


    if (
      !orderRef
    ) {

      throw new Error(
        "Bus booking order reference is required"
      );
    }


    console.log(
      "[BusBooking][API][Payment] Create Order Request",
      {

        requestUrl,

        order_ref:
          orderRef,

        hasAuthorization:
          !!authHeaders
            .Authorization,
      }
    );


    let response:
      any;


    let result:
      any;


    try {

      response =
        await api.post(
          requestUrl,
          {
            order_ref:
              orderRef,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
              ...authHeaders,
            },
          }
        );


      result =
        response?.data;


    } catch (
      error: any
    ) {

      console.log(
        "[BusBooking][API][Payment] Create Order Error",
        {
          status:
            error?.response
              ?.status,
          message:
            error?.response
              ?.data
              ?.message ||
            error?.message ||
            error,
          data:
            error?.response
              ?.data,
        }
      );

      if (
        error?.response
          ?.status === 401
      ) {

        throw new Error(
          error?.response
            ?.data
            ?.message ||
          "Invalid access token. Please login again."
        );
      }


      throw new Error(
        error?.response
          ?.data
          ?.message ||
        error?.message ||
        "Unable to create payment order"
      );
    }


    console.log(
      "[BusBooking][API][Payment] Create Order Response",
      {

        status:
          response.status,

        success:
          result?.success,

        reused:
          result?.reused,

        orderId:
          result
            ?.data
            ?.orderId,

        amount:
          result
            ?.data
            ?.amount,

        currency:
          result
            ?.data
            ?.currency,

        order_ref:
          result
            ?.data
            ?.order_ref,

        message:
          result?.message,
      }
    );


    if (
      response.status ===
      401
    ) {

      throw new Error(
        result?.message ||
        "Your login session has expired. Please login again."
      );
    }


    if (
      response.status < 200 ||
      response.status >= 300 ||
      !result
        ?.success
    ) {

      throw new Error(
        result?.message ||
        "Unable to create Razorpay order"
      );
    }


    if (
      !result
        ?.data
        ?.orderId
    ) {

      throw new Error(
        "Razorpay order ID is missing"
      );
    }


    if (
      !result
        ?.data
        ?.key
    ) {

      throw new Error(
        "Razorpay key is missing"
      );
    }


    if (
      Number(
        result
          ?.data
          ?.amount ||
        0
      ) <=
      0
    ) {

      throw new Error(
        "Invalid Razorpay order amount"
      );
    }


    return result;
  };
