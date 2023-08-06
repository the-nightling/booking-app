import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookableOrdersComponent } from './bookable-orders.component';

describe('BookableOrdersComponent', () => {
  let component: BookableOrdersComponent;
  let fixture: ComponentFixture<BookableOrdersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BookableOrdersComponent]
    });
    fixture = TestBed.createComponent(BookableOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
