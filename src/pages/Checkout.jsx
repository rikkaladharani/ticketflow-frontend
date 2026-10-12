import { useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";



function Checkout() {

   const { eventId } = useParams();

   const location = useLocation();

   const navigate = useNavigate();



   const API_URL = "http://localhost:8080";



   const [user, setUser] = useState(null);

   const [event, setEvent] = useState(null);

   const [eventSeats, setEventSeats] = useState([]);



   const [foodItems, setFoodItems] = useState([]);

   const [foodLoading, setFoodLoading] = useState(false);

   const [foodError, setFoodError] = useState("");



   const [foodQuantities, setFoodQuantities] = useState({});



   const [loading, setLoading] = useState(true);

   const [bookingLoading, setBookingLoading] = useState(false);



   const [error, setError] = useState("");



   const [couponInput, setCouponInput] = useState("");

   const [coupon, setCoupon] = useState(null);

   const [couponLoading, setCouponLoading] = useState(false);

   const [couponError, setCouponError] = useState("");

   const [couponSuccess, setCouponSuccess] = useState("");



   /*

     * -----------------------------------------

     * SELECTED SEATS FROM URL

     * -----------------------------------------

     */



   const searchParams = new URLSearchParams(location.search);

   const seatIdsParam = searchParams.get("seats");



   const selectedSeatIds = useMemo(() => {

      if (!seatIdsParam) {

         return [];

      }



      return seatIdsParam

         .split(",")

         .map((id) => Number(id))

         .filter((id) => !Number.isNaN(id));

   }, [seatIdsParam]);



   /*

     * -----------------------------------------

     * LOAD USER

     * -----------------------------------------

     */



   useEffect(() => {

      const savedUser =

         localStorage.getItem("ticketflowUser");



      if (!savedUser) {

         navigate("/login");

         return;

      }



      try {

         setUser(JSON.parse(savedUser));

      } catch (err) {

         console.error(err);

         localStorage.removeItem("ticketflowUser");

         navigate("/login");

      }

   }, [navigate]);



   /*

     * -----------------------------------------

     * LOAD EVENT + SEATS

     * -----------------------------------------

     */



   useEffect(() => {

      const loadCheckoutData = async () => {

         try {

            setLoading(true);

            setError("");



            const [eventResponse, seatsResponse] =

               await Promise.all([

                  fetch(

                     `${API_URL}/api/events/${eventId}`

                  ),

                  fetch(

                     `${API_URL}/api/event-seats/event/${eventId}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}` } }
                  ),

               ]);



            if (!eventResponse.ok) {

               throw new Error("Unable to load event");

            }



            if (!seatsResponse.ok) {

               throw new Error("Unable to load seats");

            }



            const eventData =

               await eventResponse.json();



            const seatsData =

               await seatsResponse.json();



            setEvent(eventData);

            setEventSeats(seatsData);

         } catch (err) {

            console.error(err);



            setError(

               err.message ||

                  "Unable to load checkout details"

            );

         } finally {

            setLoading(false);

         }

      };



      loadCheckoutData();

   }, [eventId]);



   /*

     * -----------------------------------------

     * LOAD FOOD FOR THIS EVENT

     * -----------------------------------------

     *

     * Only stalls approved for this event

     * should have their food displayed.

     */



   useEffect(() => {

      const loadFoodItems = async () => {

         try {

            setFoodLoading(true);

            setFoodError("");



            /*

              * First get stalls approved for this event.

              */



            const eventStallsResponse =

               await fetch(

                  `${API_URL}/api/event-stalls/event/${eventId}`,
                  { headers: { Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}` } }
                );



            if (!eventStallsResponse.ok) {

               throw new Error(

                  "Unable to load event food stalls"

               );

            }



            const eventStalls =

               await eventStallsResponse.json();



            const approvedStalls =

               Array.isArray(eventStalls)

                  ? eventStalls.filter(

                        (eventStall) =>

                           eventStall.status === "APPROVED" &&

                           eventStall.stall?.id

                     )

                  : [];



            /*

              * If no approved stalls exist,

              * food ordering is simply unavailable.

              */



            if (approvedStalls.length === 0) {

               setFoodItems([]);

               return;

            }



            /*

              * Load available menu items from

              * every approved stall.

              */



            const itemResponses =

               await Promise.all(

                  approvedStalls.map((eventStall) =>

                     fetch(

                        `${API_URL}/api/stall-items/stall/${eventStall.stall.id}/available`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}` } }
                      )

                  )

               );



            const allItems = [];



            for (

               let i = 0;

               i < itemResponses.length;

               i++

            ) {

               const response = itemResponses[i];



               if (!response.ok) {

                  continue;

               }



               const items = await response.json();



               if (Array.isArray(items)) {

                  allItems.push(...items);

               }

            }



            /*

              * Remove duplicate items just in case.

              */



            const uniqueItems = Array.from(

               new Map(

                  allItems.map((item) => [

                     item.id,

                     item,

                  ])

               ).values()

            );



            setFoodItems(uniqueItems);



            /*

              * Initialize every food quantity to 0.

              */



            const initialQuantities = {};



            uniqueItems.forEach((item) => {

               initialQuantities[item.id] = 0;

            });



            setFoodQuantities(initialQuantities);

         } catch (err) {

            console.error(err);



            setFoodItems([]);



            setFoodError(

               err.message ||

                  "Unable to load food items"

            );

         } finally {

            setFoodLoading(false);

         }

      };



      loadFoodItems();

   }, [eventId]);



   /*

     * -----------------------------------------

     * SELECTED SEATS

     * -----------------------------------------

     */



   const selectedSeats = useMemo(() => {

      return eventSeats.filter((eventSeat) =>

         selectedSeatIds.includes(eventSeat.id)

      );

   }, [eventSeats, selectedSeatIds]);



   /*

     * -----------------------------------------

     * TICKET SUBTOTAL

     * -----------------------------------------

     */



   const ticketSubtotal = useMemo(() => {

      return selectedSeats.reduce(

         (total, seat) =>

            total + Number(seat.price || 0),

         0

      );

   }, [selectedSeats]);



   /*

     * -----------------------------------------

     * SELECTED FOOD

     * -----------------------------------------

     */



   const selectedFoodItems = useMemo(() => {

      return foodItems

         .filter(

            (item) =>

               Number(foodQuantities[item.id] || 0) > 0

         )

         .map((item) => ({

            ...item,

            quantity: Number(

               foodQuantities[item.id] || 0

            ),

            totalPrice:

               Number(item.price || 0) *

               Number(foodQuantities[item.id] || 0),

         }));

   }, [foodItems, foodQuantities]);



   /*

     * -----------------------------------------

     * FOOD SUBTOTAL

     * -----------------------------------------

     */



   const foodSubtotal = useMemo(() => {

      return selectedFoodItems.reduce(

         (total, item) =>

            total + Number(item.totalPrice || 0),

         0

      );

   }, [selectedFoodItems]);



   /*

     * -----------------------------------------

     * COMBINED SUBTOTAL

     * -----------------------------------------

     */



   const combinedSubtotal =

      ticketSubtotal + foodSubtotal;



   /*

     * -----------------------------------------

     * COUPON

     * -----------------------------------------

     */



   const discountAmount =

      coupon?.discountAmount || 0;



   const finalAmount =

      coupon?.totalAmount ??

      combinedSubtotal;



   /*

     * -----------------------------------------

     * FORMATTING

     * -----------------------------------------

     */



   const formatCurrency = (amount) => {

      return `₹${Number(amount || 0).toLocaleString(

         "en-IN"

      )}`;

   };



   const formatDate = (date) => {

      if (!date) {

         return "—";

      }



      return new Date(date).toLocaleDateString(

         "en-IN",

         {

            day: "2-digit",

            month: "long",

            year: "numeric",

         }

      );

   };



   const formatTime = (time) => {

      if (!time) {

         return "—";

      }



      return time.substring(0, 5);

   };



   const getSeatDetails = (eventSeat) => {

      const seat = eventSeat.seat;



      return {

         row: seat?.seatRow || "",

         number: seat?.seatNumber || "",
         type:
            seat?.seatType ||
            seat?.section?.name ||
            "Seat",
      };
   };
   /*
     * -----------------------------------------
     * FOOD QUANTITY
     * -----------------------------------------
     */
   const increaseFoodQuantity = (item) => {
      const currentQuantity =
         Number(foodQuantities[item.id] || 0);
      const maximumQuantity =
         Number(item.availableQuantity || 0);
      if (currentQuantity >= maximumQuantity) {
         return;
      }
      setFoodQuantities((previous) => ({
         ...previous,
         [item.id]: currentQuantity + 1,
      }));
      /*
        * A previously applied coupon is no longer
        * reliable after the order amount changes.
        */
      setCoupon(null);
      setCouponError("");
      setCouponSuccess("");
   };
   const decreaseFoodQuantity = (item) => {
      const currentQuantity =
         Number(foodQuantities[item.id] || 0);
      if (currentQuantity <= 0) {
         return;
      }
      setFoodQuantities((previous) => ({
         ...previous,
         [item.id]: currentQuantity - 1,
      }));
      /*
        * Coupon needs to be reapplied after
        * changing the order amount.
        */
      setCoupon(null);
      setCouponError("");
      setCouponSuccess("");
   };
   /*
     * -----------------------------------------
     * APPLY COUPON
     * -----------------------------------------
     */
   const applyCoupon = async () => {
      if (!couponInput.trim()) {
         setCouponError(
            "Please enter a coupon code"
         );
         setCouponSuccess("");
         return;
      }
      if (combinedSubtotal <= 0) {
         setCouponError(
            "There is no valid order amount"
         );
         return;
      }
      try {
         setCouponLoading(true);
         setCouponError("");
         setCouponSuccess("");
         const response = await fetch(
            `${API_URL}/api/coupons/validate`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}`,
               },
               body: JSON.stringify({
                  code: couponInput.trim(),
                  subtotal: combinedSubtotal,
                  eventId: Number(eventId),
               }),
            }
         );
         const responseText = await response.text();
         let data = {};
         try {
           data = responseText ? JSON.parse(responseText) : {};
         } catch {
           throw new Error("The server returned an invalid response while validating the coupon.");
         }
         if (!response.ok || !data.valid) {
            throw new Error(
               data.message ||
                  "Invalid coupon code"
            );
         }
         setCoupon(data);
         setCouponInput(data.code);
         setCouponSuccess(
            data.message ||
               "Coupon applied successfully"
         );
      } catch (err) {
         console.error(err);
         setCoupon(null);
         setCouponError(
            err.message ||
               "Unable to apply coupon"
         );
      } finally {
         setCouponLoading(false);
      }
   };
   /*
     * -----------------------------------------
     * REMOVE COUPON
     * -----------------------------------------
     */
   const removeCoupon = () => {
      setCoupon(null);
      setCouponInput("");
      setCouponError("");
      setCouponSuccess("");
   };
   /*
     * -----------------------------------------
     * CREATE BOOKING
     * -----------------------------------------
     */
   const createBooking = async () => {
      if (!user) {
         navigate("/login");
         return;
      }
      if (selectedSeatIds.length === 0) {
         setError(
            "Please select at least one seat"
         );
         return;
      }
      try {
         setBookingLoading(true);
         setError("");
         /*
           * Build the food request.
           *
           * Only food with quantity > 0 is sent.
           */
         const bookingFoodItems =
            selectedFoodItems.map((item) => ({
               stallItemId: item.id,
               quantity: item.quantity,
            }));
         const bookingRequest = {
            customerId: user.id,
            eventId: Number(eventId),
            eventSeatIds: selectedSeatIds,
            foodItems: bookingFoodItems,
         };
         /*
           * Add coupon only if one is currently
           * applied.
           */
         if (coupon?.code) {
            bookingRequest.couponCode =
               coupon.code;
         }
         const response = await fetch(
            `${API_URL}/api/bookings`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("ticketflowToken") || ""}`,
               },
               body: JSON.stringify(
                  bookingRequest
               ),
            }
         );
         const responseText = await response.text();
         let data = {};
         try {
           data = responseText ? JSON.parse(responseText) : {};
         } catch {
           throw new Error("The server returned an invalid response while creating the booking.");
         }
         if (!response.ok) {
            throw new Error(
               data.message ||
                  data.error ||
                  "Unable to create booking"
            );
         }
         /*
           * Move to existing payment page.
           *
           * The booking already contains:
           * - seats
           * - food
           * - coupon
           * - final total
           */
         navigate(
            `/customer/payment/${data.id}`
         );
      } catch (err) {
         console.error(err);
         setError(
            err.message ||
               "Unable to create booking"
         );
      } finally {
         setBookingLoading(false);
      }
   };
   /*
     * -----------------------------------------
     * LOADING
     * -----------------------------------------
     */
   if (loading) {
      return (
         <div className="checkout-page">
            <div className="checkout-loading">
               Loading checkout...
            </div>
         </div>
      );
   }
   /*
     * -----------------------------------------
     * EVENT LOAD ERROR
     * -----------------------------------------
     */
   if (error && !event) {
      return (
         <div className="checkout-page">
            <div className="checkout-error">
               <h2>
                  Unable to load checkout
               </h2>
               <p>{error}</p>
               <Link
                  to={`/customer/book/${eventId}`}
               >
                  ← Back to Seat Selection
               </Link>
            </div>
         </div>
      );
   }
   /*
     * -----------------------------------------
     * PAGE
     * -----------------------------------------
     */
   return (
      <div className="checkout-page">
         <div className="checkout-container">
            <div className="checkout-header">
               <Link
                  to={`/customer/book/${eventId}`}
                  className="checkout-back"
               >
                  ← Back to Seat Selection
               </Link>
               <h1>Checkout</h1>
               <p>
                  Review your seats, add food and
                  complete your booking.
               </p>
            </div>
            {error && (
               <div className="checkout-alert">
                  ⚠️ {error}
               </div>
            )}
            <div className="checkout-grid">
               {/* =================================
                     LEFT SIDE
               ================================= */}
               <div className="checkout-main">
                  {/* EVENT */}
                  <div className="checkout-card">
                     <div className="checkout-card-title">
                        <span className="checkout-card-icon">
                           🎟️
                        </span>
                        <div>
                           <h2>
                              {event?.title}
                           </h2>
                           <p>
                              {formatDate(
                                 event?.eventDate
                              )}
                              {" • "}
                              {formatTime(
                                 event?.startTime
                              )}
                           </p>
                        </div>
                     </div>
                     <div className="checkout-event-details">
                        <div>
                           <span>Venue</span>
                           <strong>
                              {event?.venue?.name ||
                                 "TICKETFLOW Venue"}
                           </strong>
                        </div>
                        <div>
                           <span>Location</span>
                           <strong>
                              {event?.venue?.city ||
                                 "Hyderabad"}
                           </strong>
                        </div>
                     </div>
                  </div>
                  {/* SELECTED SEATS */}
                  <div className="checkout-card">
                     <div className="checkout-section-heading">
                        <div>
                           <h2>
                              Selected Seats
                           </h2>
                           <p>
                              {selectedSeats.length} seat
                              {selectedSeats.length !== 1
                                 ? "s"
                                 : ""} selected
                           </p>
                        </div>
                     </div>
                     {selectedSeats.length === 0 ? (
                        <div className="checkout-empty">
                           No seats selected.
                        </div>
                     ) : (
                        <div className="checkout-seat-list">
                           {selectedSeats.map(
                              (eventSeat) => {
                                 const seat =
                                    getSeatDetails(
                                       eventSeat
                                    );
                                 return (
                                    <div
                                       className="checkout-seat"
                                       key={eventSeat.id}
                                    >
                                       <div className="checkout-seat-number">
                                          {seat.row}
                                          {seat.number}
                                       </div>
                                       <div className="checkout-seat-details">
                                          <strong>
                                             {seat.type}
                                          </strong>
                                          <span>
                                             Event Seat #
                                             {eventSeat.id}
                                          </span>
                                       </div>
                                       <strong className="checkout-seat-price">
                                          {formatCurrency(
                                             eventSeat.price
                                          )}
                                       </strong>
                                    </div>
                                 );
                              }
                           )}
                        </div>
                     )}
                  </div>
                  {/* =================================
                        FOOD & BEVERAGES
                  ================================= */}
                  <div className="checkout-card">
                     <div className="checkout-section-heading">
                        <div>
                           <h2>
                              🍔 Food & Beverages
                           </h2>
                           <p>
                              Add food from approved event
                              stalls to your order.
                           </p>
                        </div>
                     </div>
                     {foodLoading ? (
                        <div className="checkout-empty">
                           Loading food menu...
                        </div>
                     ) : foodError ? (
                        <div className="checkout-empty">
                           <p>
                              ⚠️ {foodError}
                           </p>
                           <small>
                              Food ordering is temporarily
                              unavailable. You can continue
                              with tickets only.
                           </small>
                        </div>
                     ) : foodItems.length === 0 ? (
                        <div className="checkout-empty">
                           <strong>
                              No food stalls available
                           </strong>
                           <p>
                              There are currently no approved
                              food stalls for this event.
                           </p>
                        </div>
                     ) : (
                        <div
                           style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                           }}
                        >
                           {foodItems.map((item) => {
                              const quantity =
                                 Number(
                                    foodQuantities[item.id] ||
                                       0
                                 );
                              return (
                                 <div
                                    key={item.id}
                                    style={{
                                       display: "flex",
                                       alignItems: "center",
                                       justifyContent:
                                          "space-between",
                                       gap: "16px",
                                       padding: "14px",
                                       border:
                                          "1px solid var(--border)",
                                       borderRadius:
                                          "12px",
                                       background:
                                          "var(--surface)",
                                    }}
                                 >
                                    <div
                                       style={{
                                          flex: 1,
                                       }}

                                    >
                                       <strong
                                          style={{
                                             display: "block",
                                             marginBottom:
                                                "4px",
                                          }}
                                       >
                                          {item.itemName}
                                       </strong>
                                       <span
                                          style={{
                                             display: "block",
                                             color:
                                                "var(--text-muted)",
                                             fontSize:
                                                "0.9rem",
                                          }}
                                       >
                                          {item.category}
                                       </span>
                                       {item.description && (
                                          <span
                                             style={{
                                                display:
                                                   "block",
                                                color:
                                                   "var(--text-muted)",
                                                fontSize:
                                                   "0.85rem",
                                                marginTop:
                                                   "3px",
                                             }}
                                          >
                                             {item.description}
                                          </span>
                                       )}
                                       <strong
                                          style={{
                                             display: "block",
                                             marginTop:
                                                "6px",
                                          }}
                                       >
                                          {formatCurrency(
                                             item.price
                                          )}
                                       </strong>
                                       <small
                                          style={{
                                             color:
                                                "var(--text-muted)",
                                          }}
                                       >
                                          {item.availableQuantity}{" "}
                                          available
                                       </small>
                                    </div>
                                    <div
                                       style={{
                                          display: "flex",
                                          alignItems:
                                             "center",
                                          gap: "10px",
                                       }}
                                    >
                                       <button
                                          type="button"
                                          onClick={() =>
                                             decreaseFoodQuantity(
                                                item
                                             )
                                          }
                                          disabled={
                                             quantity <= 0
                                          }
                                          style={{
                                             width: "34px",
                                             height: "34px",
                                             border:
                                                "1px solid var(--border)",
                                             borderRadius:
                                                "8px",
                                             background:
                                                "var(--surface)",
                                             cursor:
                                                quantity > 0
                                                   ? "pointer"
                                                   : "not-allowed",
                                             fontSize:
                                                "1.1rem",
                                          }}
                                       >
                                          −
                                       </button>
                                       <strong
                                          style={{
                                             minWidth: "24px",
                                             textAlign:
                                                "center",
                                          }}
                                       >
                                          {quantity}
                                       </strong>
                                       <button
                                          type="button"
                                          onClick={() =>
                                             increaseFoodQuantity(
                                                item
                                             )
                                          }
                                          disabled={
                                             quantity >=
                                             Number(
                                                item.availableQuantity ||
                                                   0
                                             )
                                          }
                                          style={{
                                             width: "34px",
                                             height: "34px",
                                             border:
                                                "1px solid var(--border)",
                                             borderRadius:
                                                "8px",
                                             background:
                                                "var(--primary)",
                                             color: "white",
                                             cursor:
                                                quantity <
                                                Number(
                                                   item.availableQuantity ||
                                                      0
                                                )
                                                   ? "pointer"
                                                   : "not-allowed",
                                             fontSize:
                                                "1.1rem",
                                          }}
                                       >
                                          +
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
                  {/* CUSTOMER DETAILS */}
                  <div className="checkout-card">
                     <div className="checkout-section-heading">
                        <div>
                           <h2>
                              Customer Details
                           </h2>
                           <p>
                              Ticket and food order will
                              be associated with this
                              account.
                           </p>
                        </div>
                     </div>
                     <div className="checkout-customer">
                        <div>
                           <span>Name</span>
                           <strong>
                              {user?.firstName}{" "}
                              {user?.lastName}
                           </strong>
                        </div>
                        <div>
                           <span>Email</span>
                           <strong>
                              {user?.email}
                           </strong>
                        </div>
                     </div>
                  </div>
                  {/* COUPON */}
                  <div className="checkout-card coupon-card">
                     <div className="checkout-section-heading">
                        <div>
                           <h2>
                              🎟️ Have a coupon?
                           </h2>
                           <p>
                              Coupon discounts apply to
                              the combined ticket and food
                              subtotal.
                           </p>
                        </div>
                     </div>
                     {!coupon ? (
                        <>
                           <div className="coupon-input-row">
                              <input
                                 type="text"
                                 value={couponInput}
                                 onChange={(e) => {
                                    setCouponInput(
                                       e.target.value
                                          .toUpperCase()
                                    );
                                    /*
                                      * Changing coupon input
                                      * doesn't change order,
                                      * so no other state needed.
                                      */
                                 }}
                                 placeholder="Enter coupon code"
                                 maxLength={30}
                              />
                              <button
                                 type="button"
                                 onClick={applyCoupon}
                                 disabled={
                                    couponLoading
                                 }
                              >
                                 {couponLoading
                                    ? "Applying..."
                                    : "Apply"}
                              </button>
                           </div>
                           {couponError && (
                              <div className="coupon-error">
                                 ⚠️ {couponError}
                              </div>
                           )}
                        </>
                     ) : (
                        <div className="coupon-applied">
                           <div className="coupon-applied-left">
                              <div className="coupon-check">
                                 ✓
                              </div>
                              <div>
                                 <strong>
                                    {coupon.code}
                                 </strong>
                                 <span>
                                    {couponSuccess ||
                                       "Coupon applied"}
                                 </span>
                              </div>
                           </div>
                           <button
                              type="button"
                              className="coupon-remove"
                              onClick={removeCoupon}
                           >
                              Remove
                           </button>
                        </div>
                     )}
                     {couponSuccess &&
                        !coupon && (
                           <div className="coupon-success">
                              ✓ {couponSuccess}
                           </div>
                        )}
                  </div>
               </div>
               {/* =================================
                     RIGHT SIDE
               ================================= */}
               <div className="checkout-sidebar">
                  <div className="checkout-summary-card">
                     <h2>
                        Order Summary
                     </h2>
                     {/* TICKETS */}
                     <div className="summary-line">
                        <span>
                           Tickets
                           {" "}
                           ({selectedSeats.length})
                        </span>
                        <strong>
                           {formatCurrency(
                              ticketSubtotal
                           )}
                        </strong>
                     </div>
                     {/* FOOD */}
                     {foodSubtotal > 0 && (
                        <div className="summary-line">
                           <span>
                              Food
                              {" "}
                              ({selectedFoodItems.reduce(
                                 (total, item) =>
                                    total +
                                    item.quantity,
                                 0
                              )} items)
                           </span>
                           <strong>
                              {formatCurrency(
                                 foodSubtotal
                              )}
                           </strong>
                        </div>
                     )}
                     {/* COMBINED SUBTOTAL */}
                     {foodSubtotal > 0 && (
                        <div className="summary-line">
                           <span>
                              Combined Subtotal
                           </span>
                           <strong>
                              {formatCurrency(
                                 combinedSubtotal
                              )}
                           </strong>
                        </div>
                     )}
                     {/* DISCOUNT */}
                     {coupon && (
                        <div className="summary-line summary-discount">
                           <span>
                              Discount
                              {" "}
                              ({coupon.code})
                           </span>
                           <strong>
                              -
                              {formatCurrency(
                                 discountAmount
                              )}
                           </strong>
                        </div>
                     )}
                     <div className="summary-divider">
                     </div>
                     {/* TOTAL */}
                     <div className="summary-total">
                        <span>
                           Total
                        </span>
                        <strong>
                           {formatCurrency(
                              finalAmount
                           )}
                        </strong>
                     </div>
                     {coupon && (
                        <div className="summary-saved">
                           🎉 You saved{" "}
                           {formatCurrency(
                              discountAmount
                           )}
                        </div>
                     )}
                     <button
                        type="button"
                        className="checkout-pay-btn"
                        onClick={createBooking}
                        disabled={
                           bookingLoading ||
                           selectedSeats.length === 0
                        }
                     >
                        {bookingLoading
                           ? "Creating Booking..."
                           : "Continue to Payment →"}
                     </button>
                     <p className="checkout-secure">
                        🔒 Secure simulated payment
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
export default Checkout;