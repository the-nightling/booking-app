import {
  Component,
  Input,
  OnInit,
  LOCALE_ID,
  Inject,
  OnDestroy
} from "@angular/core";
import { BookingOrder } from "../../models/booking-order.model";
import { BookingOperation } from "../../enums/booking-operation.enum";
import { Subscription, debounceTime } from "rxjs";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import { CommonModule, formatDate } from "@angular/common";
import { Booking } from "../../models/booking.model";
import * as _ from "lodash-es";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FocusDirective } from "../../../core/directives/focus.directive";
import { OrdersService } from "../../services/orders.service";
import { Order } from "../../models/order.model";

@Component({
  selector: "app-event-modal-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FocusDirective
  ],
  templateUrl: "./event-modal-dialog.component.html",
  styleUrls: ["./event-modal-dialog.component.scss"]
})
export class EventModalDialogComponent implements OnInit, OnDestroy {
  protected bookingForm = new FormGroup(
    {
      resourceId: new FormControl("", Validators.required),
      orderId: new FormControl("", Validators.required),
      title: new FormControl("", Validators.required),
      date: new FormControl("", Validators.required),
      startTime: new FormControl("", Validators.required),
      endTime: new FormControl("", Validators.required),
      description: new FormControl("")
    },
    {
      validators: [this.startEndTimesValidator]
    }
  );

  public bookableOrders: Order[] = [];
  protected valuesChanged: boolean = false;
  protected readonly BookingOperation = BookingOperation;
  private data: any = {};

  private bookableOrdersSubscription: Subscription | undefined;
  private bookingFormValuechangesSubscription: Subscription | undefined;

  constructor(
    public ordersService: OrdersService,
    public dialogRef: MatDialogRef<EventModalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public bookingOrder: BookingOrder,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.bookableOrdersSubscription =
      this.ordersService.bookableOrders$.subscribe({
        next: (result) => (this.bookableOrders = result),
        error: (error) => console.log(error)
      });

    if (this.bookingOrder?.booking) {
      this.data = _.clone(this.bookingOrder?.booking);

      this.bookingForm.setValue({
        resourceId: this.bookingOrder.booking.orderId ?? "",
        orderId: this.bookingOrder.booking.orderId ?? "",
        title: this.bookingOrder.booking.title ?? "",
        date: formatDate(
          this.bookingOrder.booking.start,
          "yyyy-MM-dd",
          this.locale
        ),
        startTime: formatDate(
          this.bookingOrder.booking.start,
          "HH:mm",
          this.locale
        ),
        endTime: formatDate(
          this.bookingOrder.booking.end,
          "HH:mm",
          this.locale
        ),
        description: this.bookingOrder.booking.description ?? ""
      });
    }

    this.refreshData();
  }

  ngOnDestroy(): void {
    this.bookableOrdersSubscription?.unsubscribe();
    this.bookingFormValuechangesSubscription?.unsubscribe();
  }

  delete() {
    this.dialogRef.close({
      operation: BookingOperation.Delete,
      booking: this.data
    });
  }

  upsert() {
    this.dialogRef.close({
      operation: this.bookingOrder!.operation,
      booking: this.data
    });
  }

  onOrderSelectionChange(newOrderId: string) {
    console.log(newOrderId);
    let order = this.bookableOrders.find((o) => o.id == newOrderId);

    this.bookingForm.patchValue({
      resourceId: order?.id,
      title: order?.productCatalogue.title,
      description: order?.productCatalogue.title
    });
  }

  private refreshData() {
    this.bookingFormValuechangesSubscription = this.bookingForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe((changes) => {
        for (let key of Object.keys(changes)) {
          const changesKey = key as keyof Object;
          const objKey = key as keyof Booking;

          this.data[objKey] = changes[changesKey];
        }

        if (this.bookingForm.value.date && this.bookingForm.value.startTime) {
          this.data.start = this.stringToDate(
            this.bookingForm.value.date,
            this.bookingForm.value.startTime
          );
        }

        if (this.bookingForm.value.date && this.bookingForm.value.endTime) {
          this.data.end = this.stringToDate(
            this.bookingForm.value.date,
            this.bookingForm.value.endTime
          );
        }

        let after = this.data as Booking;
        let before = this.bookingOrder?.booking as Booking;

        this.valuesChanged = !_.isEqual(before, after);
      });
  }

  private stringToDate(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const time = timeStr.split(":");

    date.setHours(parseInt(time[0]));
    date.setMinutes(parseInt(time[1]));

    return date;
  }

  private startEndTimesValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const startControl = control.get("startTime");
    const endControl = control.get("endTime");

    if (startControl && endControl) {
      const startSplit = startControl.value.split(":");
      const endSplit = endControl.value.split(":");

      if (
        parseInt(endSplit[0]) * 60 + parseInt(endSplit[1]) <
        parseInt(startSplit[0]) * 60 + parseInt(startSplit[1])
      ) {
        return { startTimeAfterEndTime: true };
      }
    }

    return null;
  }
}
