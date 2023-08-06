export interface Booking {
  id?: string;
  orderId: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  appointeeId: string;
}
