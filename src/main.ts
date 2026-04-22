import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    
    // Amboary eto ny configuration
    provideIonicAngular({
      scrollAssist: true,      // Manampy ny input hiseho eo ambonin'ny klavier
      scrollPadding: true,     // Manampy espace ahafahana mikorisa (scroll)
      inputBlurring: false     // Miaro ny focus an'ilay input
    }),
    
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});