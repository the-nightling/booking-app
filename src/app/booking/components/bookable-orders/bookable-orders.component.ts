import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Draggable } from "@fullcalendar/interaction";
import { OrdersService } from "../../services/orders.service";
import { Order } from "../../models/order.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-bookable-orders",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./bookable-orders.component.html",
  styleUrls: ["./bookable-orders.component.scss"]
})
export class BookableOrdersComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild("external") external: ElementRef | undefined;
  public bookableOrders: Order[] = [];

  private bookableOrdersSubscription: Subscription | undefined;

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.bookableOrdersSubscription =
      this.ordersService.bookableOrders$.subscribe({
        next: (result) => (this.bookableOrders = result),
        error: (error) => console.log(error)
      });
  }

  ngAfterViewInit(): void {
    if (this.external) {
      new Draggable(this.external.nativeElement, {
        itemSelector: ".fc-event",
        eventData: function (eventEl) {
          return {
            title: eventEl.innerText,
            create: false
          };
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.bookableOrdersSubscription?.unsubscribe();
  }
}
