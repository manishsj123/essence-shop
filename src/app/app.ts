import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Products } from "./products/products";
import { New } from "./new/new";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Products, New],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Angular-20-App';
}
