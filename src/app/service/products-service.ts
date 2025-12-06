import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  brand: string;
  category: string;
}

interface ProductState {
  items: Product[];
  page: number;
  query: string;
  loading: boolean;
  hasMore: boolean;
}

@Injectable({ 
  providedIn: 'root'
})

export class ProductsService {
  private readonly limit = 20;

  state = signal<ProductState>({
    items: [],
    page: 0,
    query: '',
    loading: false,
    hasMore: true,
  });

  constructor(private http: HttpClient) { }

  loadMore() {
    const s = this.state();
    if (s.loading || !s.hasMore) return;

    this.state.update(v => ({ ...v, loading: true }));
    const skip = s.page * this.limit;

    const url = s.query
      ? `https://dummyjson.com/products/search?q=${s.query}&limit=${this.limit}&skip=${skip}`
      : `https://dummyjson.com/products?limit=${this.limit}&skip=${skip}`;

    this.http.get<{ products: Product[]; total: number }>(url)
      .pipe(
        tap(res => {
          this.state.update(v => ({
            ...v,
            items: [...v.items, ...res.products],
            page: v.page + 1,
            hasMore: v.items.length + res.products.length < res.total,
            loading: false
          }));
        })
      ).subscribe();
  }

  search(query: string) {
    this.state.set({
      items: [],
      page: 0,
      query,
      loading: false,
      hasMore: true
    });
    this.loadMore();
  }

  updateProduct(updated: Product) {
    this.state.update(s => ({
      ...s,
      items: s.items.map(p => p.id === updated.id ? updated : p)
    }));
  }
}
