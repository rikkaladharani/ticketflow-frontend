import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import CustomerDashboard from "./pages/CustomerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import StallOwnerDashboard from "./pages/StallOwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import MyTickets from "./pages/MyTickets";
import SeatBooking from "./pages/SeatBooking";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import CreateEvent from "./pages/CreateEvent.jsx";
import AllEvents from "./pages/AllEvents";
import AdminUsers from "./pages/AdminUsers";
import CustomerWishlist from "./pages/CustomerWishlist";
import CustomerProfile from "./pages/CustomerProfile";
import UserProfile from "./pages/UserProfile";
import AddStall from "./pages/AddStall";
import MyStalls from "./pages/MyStalls";
import AvailableEvents from "./pages/AvailableEvents";
import StallApplications from "./pages/StallApplications";
import AdminStallApprovals from "./pages/AdminStallApprovals";
import OrganizerStallApplications from "./pages/OrganizerStallApplications";
import AdminEvents from "./pages/AdminEvents";
import AdminVenues from "./pages/AdminVenues";
import AdminAnalytics from "./pages/AdminAnalytics";

// Newly implemented modules
import QrCheckInScanner from "./pages/QrCheckInScanner";
import AdminRefunds from "./pages/AdminRefunds";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/events" element={<AllEvents />} />

      {/* UNIVERSAL PROFILE */}
      <Route path="/profile" element={<UserProfile />} />

      {/* CUSTOMER PORTAL */}
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/customer/tickets" element={<MyTickets />} />
      <Route path="/customer/book/:eventId" element={<SeatBooking />} />
      <Route path="/customer/checkout/:eventId" element={<Checkout />} />
      <Route path="/customer/payment/:bookingId" element={<Payment />} />
      <Route path="/customer/payment-success/:bookingId" element={<PaymentSuccess />} />
      <Route path="/customer/wishlist" element={<CustomerWishlist />} />
      <Route path="/customer/profile" element={<UserProfile />} />

      {/* ORGANIZER PORTAL */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/create-event" element={<CreateEvent />} />
      <Route path="/organizer/stall-applications" element={<OrganizerStallApplications />} />
      <Route path="/organizer/check-in" element={<QrCheckInScanner />} />
      <Route path="/organizer/profile" element={<UserProfile />} />

      {/* STALL OWNER PORTAL */}
      <Route path="/stall-owner/dashboard" element={<StallOwnerDashboard />} />
      <Route path="/stall-owner/add" element={<AddStall />} />
      <Route path="/stall-owner/stalls" element={<MyStalls />} />
      <Route path="/stall-owner/events" element={<AvailableEvents />} />
      <Route path="/stall-owner/applications" element={<StallApplications />} />
      <Route path="/stall-owner/profile" element={<UserProfile />} />

      {/* ADMIN PORTAL */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/venues" element={<AdminVenues />} />
      <Route path="/admin/stall-approvals" element={<AdminStallApprovals />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/refunds" element={<AdminRefunds />} />
      <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
      <Route path="/admin/profile" element={<UserProfile />} />
    </Routes>
    <ChatbotWidget />
    </>
  );
}

export default App;