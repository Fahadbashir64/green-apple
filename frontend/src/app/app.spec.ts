import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should set the document title', () => {
    TestBed.createComponent(App);
    expect(TestBed.inject(Title).getTitle()).toBe('Green Apple');
  });
});
