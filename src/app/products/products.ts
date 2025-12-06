import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Product, ProductsService } from '../service/products-service';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products {

  constructor(public products: ProductsService) { }

  searchControl = new FormControl('', { nonNullable: true });

  editingId = signal<number | null>(null);
  editForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    price: new FormControl(0, { nonNullable: true }),
    stock: new FormControl(0, { nonNullable: true })
  });

  ngOnInit() {
    // Debounce live search
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(q => this.products.search(q));

    this.products.loadMore();
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      debugger
      this.products.loadMore();
    }
    console.log(this.products.state());
  }

  startEdit(product: Product) {
    this.editingId.set(product.id);
    this.editForm.patchValue(product);
  }

  save(product: Product) {
    const updated = {
      ...product,
      ...this.editForm.value
    } as Product;

    this.products.updateProduct(updated);
    this.editingId.set(null);
  }

  cancel() {
    this.editingId.set(null);
  }
}
