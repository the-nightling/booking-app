import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable, Subject, Subscription, switchMap, tap } from "rxjs";
import { add } from "date-fns";

import interactionPlugin, {
  DateClickArg,
  DropArg
} from "@fullcalendar/interaction";
import {
  Calendar,
  CalendarOptions,
  EventClickArg,
  EventDropArg
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  FullCalendarComponent,
  FullCalendarModule
} from "@fullcalendar/angular";

import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { EventModalDialogComponent } from "../event-modal-dialog/event-modal-dialog.component";

import { BookableOrdersComponent } from "../bookable-orders/bookable-orders.component";
import { OrdersService } from "../../services/orders.service";
import { Order } from "../../models/order.model";
import { BookingOrder } from "../../models/booking-order.model";
import { Booking } from "../../models/booking.model";
import { AuthenticationService } from "src/app/core/services/authentication.service";
import { User } from "src/app/core/models/user.model";
import { BookingOperation } from "../../enums/booking-operation.enum";

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    EventModalDialogComponent,
    BookableOrdersComponent,
    MatDialogModule
  ],
  templateUrl: "./calendar.component.html",
  styleUrls: ["./calendar.component.scss"]
})
export class CalendarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("calendar") fullCalendar: FullCalendarComponent | undefined;

  calendar: Calendar | undefined;
  calendarOptions: CalendarOptions;

  private bookableOrders: Order[] = [];
  private user: User | undefined;

  private destroy$: Subject<void>;
  private bookableOrdersSubscription: Subscription | undefined;
  private refreshOrdersSubscription: Subscription | undefined;
  private refreshBookableOrdersSubscription: Subscription | undefined;
  private getUserSubscription: Subscription | undefined;
  private getBookingsSubscription: Subscription | undefined;
  private updateBookingSubscription: Subscription | undefined;
  private bookingOperationSubscription: Subscription | undefined;

  constructor(
    private dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private ordersService: OrdersService
  ) {
    this.calendarOptions = {};
    this.destroy$ = new Subject();
  }

  ngOnInit() {
    this.calendarOptions = {
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      },
      events: (info, successCallback, failureCallback) => {
        this.getBookingsSubscription = this.ordersService
          .getBookings(info.start, info.end)
          .subscribe({
            next: (bookings) => {
              const eventInputs = bookings.map((b) => ({
                id: b.id,
                title: b.title,
                start: b.start,
                end: b.end,
                extendedProps: {
                  orderId: b.orderId,
                  description: b.description,
                  appointeeId: b.appointeeId
                }
              }));
              successCallback(eventInputs);
            },
            error: (error) => failureCallback(error)
          });
      },
      headerToolbar: {
        left: "prev,title,next",
        center: "",
        right: "dayGridMonth,timeGridWeek,timeGridDay"
      },
      dayHeaderFormat: {
        weekday: "long"
      },
      initialView: "dayGridMonth",
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      themeSystem: "standard",
      firstDay: 1,
      editable: true,
      droppable: true,
      dateClick: this.handleDateClick,
      eventClick: this.handleEventClick,
      drop: this.handleExternalDrop,
      eventDrop: this.handleEventDrop
    };

    this.getUserSubscription = this.authenticationService.getUser().subscribe({
      next: (result) => (this.user = result),
      error: (error) => console.log(error)
    });

    this.bookableOrdersSubscription =
      this.ordersService.bookableOrders$.subscribe({
        next: (result) => (this.bookableOrders = result),
        error: (error) => console.log(error)
      });

    this.refreshOrdersSubscription = this.ordersService
      .refreshOrders()
      .subscribe();

    this.refreshBookableOrdersSubscription = this.ordersService
      .refreshBookableOrders()
      .subscribe();
  }

  ngAfterViewInit() {
    if (this.fullCalendar) {
      this.calendar = this.fullCalendar.getApi();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.bookableOrdersSubscription?.unsubscribe();
    this.refreshOrdersSubscription?.unsubscribe();
    this.refreshBookableOrdersSubscription?.unsubscribe();
    this.getUserSubscription?.unsubscribe();
    this.getBookingsSubscription?.unsubscribe();
    this.updateBookingSubscription?.unsubscribe();
    this.bookingOperationSubscription?.unsubscribe();
  }

  handleExternalDrop = (arg: DropArg) => {
    let droppedOrder = this.bookableOrders.find(
      (o) => o.id == arg.draggedEl.id
    );
    if (droppedOrder) {
      this.createBooking(droppedOrder.id, arg.date);
    }
  };

  handleEventDrop = (arg: EventDropArg) => {
    this.updateBookingSubscription = this.ordersService
      .updateBooking(
        arg.event.id,
        arg.event.extendedProps["orderId"],
        arg.event.extendedProps["description"],
        arg.event.start!,
        arg.event.end!
      )
      .pipe(
        tap((result) => this.calendar!.refetchEvents()),
        switchMap((result) => this.ordersService.refreshOrders()),
        switchMap((result) => this.ordersService.refreshBookableOrders())
      )
      .subscribe({
        error: (error) => console.log(error)
      });
  };

  handleDateClick = (arg: DateClickArg) => {
    if (this.bookableOrders.length == 0) return;

    let order = this.bookableOrders[0];
    this.createBooking(order.id, arg.date);
  };

  handleEventClick = (arg: EventClickArg) => {
    let bookingId = arg.event.id;
    let title = arg.event.title;
    let startDate = arg.event.start!;
    let endDate = arg.event.end!;
    let orderId = arg.event.extendedProps["orderId"];
    let description = arg.event.extendedProps["description"];

    this.updateBooking(
      bookingId,
      orderId,
      title,
      description,
      startDate,
      endDate
    );
  };

  createBooking(orderId: string, startDate: Date) {
    const defaultStartTime = 9;
    let order = this.bookableOrders.find((o) => o.id == orderId);
    if (order && this.user) {
      let newBooking: Booking = {
        orderId: order.id,
        title: order.productCatalogue.title,
        description: order.productCatalogue.title,
        start: add(startDate, { hours: defaultStartTime }),
        end: add(startDate, {
          hours: defaultStartTime,
          seconds: order.productCatalogue.duration
        }),
        appointeeId: this.user.id
      };

      this.openModal({
        operation: BookingOperation.Create,
        booking: newBooking
      });
    }
  }

  updateBooking(
    bookingId: string,
    orderId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date
  ) {
    if (this.user) {
      let bookingToUpdate: Booking = {
        id: bookingId,
        orderId: orderId,
        title: title,
        description: description,
        start: startDate,
        end: endDate,
        appointeeId: this.user.id
      };

      this.openModal({
        operation: BookingOperation.Edit,
        booking: bookingToUpdate
      });
    }
  }

  openModal(bookingOrder: BookingOrder) {
    const dialogRef = this.dialog.open(EventModalDialogComponent, {
      width: "Small",
      data: bookingOrder
    });

    dialogRef.afterClosed().subscribe((result: BookingOrder) => {
      let bookingOperation$: Observable<Booking>;
      if (result.operation == BookingOperation.Create) {
        bookingOperation$ = this.ordersService.createBooking(
          result.booking.orderId,
          result.booking.description,
          result.booking.start,
          result.booking.end
        );
      } else if (result.operation == BookingOperation.Edit) {
        bookingOperation$ = this.ordersService.updateBooking(
          result.booking.id!,
          result.booking.orderId,
          result.booking.description,
          result.booking.start,
          result.booking.end
        );
      } else if (result.operation == BookingOperation.Delete) {
        bookingOperation$ = this.ordersService.deleteBooking(
          result.booking.id!
        );
      } else {
        return;
      }

      this.bookingOperationSubscription = bookingOperation$
        .pipe(
          tap((result) => this.calendar!.refetchEvents()),
          switchMap((result) => this.ordersService.refreshOrders()),
          switchMap((result) => this.ordersService.refreshBookableOrders())
        )
        .subscribe({
          error: (error) => console.log(error)
        });
    });
  }
}
