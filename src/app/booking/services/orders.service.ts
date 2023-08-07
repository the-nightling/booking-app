import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { Order } from "../models/order.model";
import { Booking } from "../models/booking.model";
import { environment } from "src/environments/environment";
import { result } from "lodash-es";

@Injectable({
  providedIn: "root"
})
export class OrdersService {
  public orders$: BehaviorSubject<Order[]>;
  public bookableOrders$: BehaviorSubject<Order[]>;

  constructor(private httpClient: HttpClient) {
    this.orders$ = new BehaviorSubject<Order[]>([]);
    this.bookableOrders$ = new BehaviorSubject<Order[]>([]);
  }

  public get orders(): Order[] {
    return this.orders$.value;
  }

  public get bookableOrders(): Order[] {
    return this.bookableOrders$.value;
  }

  public refreshOrders(): Observable<Order[]> {
    return this.httpClient
      .get<Order[]>(`${environment.apiUrl}/orders/all`)
      .pipe(
        tap((result) => {
          this.orders$.next(result);
        })
      );
    // return of([
    //   {
    //     id: "bdbd857b-ef33-4d63-a8b9-08db8f61e403",
    //     productCatalogueId: "33e22940-fef5-4c26-b6ef-319d26ffa909",
    //     customerId: "79caebb1-f0c0-4cd1-a69f-50437c54865d",
    //     quantity: 1,
    //     timesBooked: 0,
    //     productCatalogue: {
    //       id: "33e22940-fef5-4c26-b6ef-319d26ffa909",
    //       title: "1 hr Physiotherapy Session",
    //       duration: 3600
    //     }
    //   }
    // ]);
  }

  public refreshBookableOrders(): Observable<Order[]> {
    return this.httpClient
      .get<Order[]>(`${environment.apiUrl}/orders/bookable`)
      .pipe(
        tap((result) => {
          this.bookableOrders$.next(result);
        })
      );
    // return of([
    //   {
    //     id: "bdbd857b-ef33-4d63-a8b9-08db8f61e403",
    //     productCatalogueId: "33e22940-fef5-4c26-b6ef-319d26ffa909",
    //     customerId: "79caebb1-f0c0-4cd1-a69f-50437c54865d",
    //     quantity: 1,
    //     timesBooked: 0,
    //     productCatalogue: {
    //       id: "33e22940-fef5-4c26-b6ef-319d26ffa909",
    //       title: "1 hr Physiotherapy Session",
    //       duration: 3600
    //     }
    //   }
    // ]);
  }

  public getBookings(startDate: Date, endDate: Date): Observable<Booking[]> {
    return this.httpClient.get<Booking[]>(
      `${environment.apiUrl}/orders/bookings`,
      {
        params: {
          Start: startDate.toISOString(),
          End: endDate.toISOString()
        }
      }
    );
  }

  public createBooking(
    orderId: string,
    productDescription: string,
    startDate: Date,
    endDate: Date
  ): Observable<Booking> {
    return this.httpClient.post<Booking>(
      `${environment.apiUrl}/orders/bookings`,
      {
        orderId: orderId,
        description: productDescription,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    );
  }

  public updateBooking(
    bookingId: string,
    orderId: string,
    productDescription: string,
    startDate: Date,
    endDate: Date
  ): Observable<Booking> {
    return this.httpClient.put<Booking>(
      `${environment.apiUrl}/orders/bookings`,
      {
        id: bookingId,
        orderId: orderId,
        description: productDescription,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    );
  }

  public deleteBooking(bookingId: string): Observable<Booking> {
    return this.httpClient.delete<Booking>(
      `${environment.apiUrl}/orders/bookings/${bookingId}`
    );
  }
}
