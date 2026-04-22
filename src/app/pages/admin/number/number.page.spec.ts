import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NumberPage } from './number.page';

describe('NumberPage', () => {
  let component: NumberPage;
  let fixture: ComponentFixture<NumberPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
