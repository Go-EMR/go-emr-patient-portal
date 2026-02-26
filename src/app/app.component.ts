import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommandPaletteComponent } from './shared/ui/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommandPaletteComponent],
  template: `
    <router-outlet></router-outlet>
    <app-command-palette></app-command-palette>
  `,
  styles: [':host { display: block; min-height: 100vh; }']
})
export class AppComponent {}
