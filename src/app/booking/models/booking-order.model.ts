import {Booking} from "./booking.model";
import {BookingOperation} from "../enums/booking-operation.enum";

export interface BookingOrder {
  operation: BookingOperation;
  booking: Booking;
}
