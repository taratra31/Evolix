import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicationsPage } from './publications.page';

describe('PublicationsPage', () => {
  let component: PublicationsPage;
  let fixture: ComponentFixture<PublicationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
