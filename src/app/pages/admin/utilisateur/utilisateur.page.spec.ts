import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilisateurPage } from './utilisateur.page';

describe('UtilisateurPage', () => {
  let component: UtilisateurPage;
  let fixture: ComponentFixture<UtilisateurPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UtilisateurPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
