import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TachePage } from './tache.page';

describe('TachePage', () => {
  let component: TachePage;
  let fixture: ComponentFixture<TachePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TachePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
