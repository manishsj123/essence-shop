import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

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

interface PlpResponse {
  products: Product[];
  total: number;
}

@Injectable({
  providedIn: 'root',
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

  constructor(private http: HttpClient) {}

  loadMore() {
    const s = this.state();
    if (s.loading || !s.hasMore) return;

    this.state.update((v) => ({ ...v, loading: true }));
    const skip = s.page * this.limit;

    const url = s.query
      ? `https://dummyjson.com/products/search?q=${s.query}&limit=${this.limit}&skip=${skip}`
      : `https://dummyjson.com/products?limit=${this.limit}&skip=${skip}`;

    this.http
      .get<{ products: Product[]; total: number }>(url)
      .pipe(
        tap((res) => {
          this.state.update((v) => ({
            ...v,
            items: [...v.items, ...res.products],
            page: v.page + 1,
            hasMore: v.items.length + res.products.length < res.total,
            loading: false,
          }));
        })
      )
      .subscribe();
  }

  search(query: string) {
    this.state.set({
      items: [],
      page: 0,
      query,
      loading: false,
      hasMore: true,
    });
    this.loadMore();
  }

  updateProduct(updated: Product) {
    this.state.update((s) => ({
      ...s,
      items: s.items.map((p) => (p.id === updated.id ? updated : p)),
    }));
  }

  fetchPlp(query: any) {
    const limit = 12;
    const skip = (query.page - 1) * limit;

    return this.http
      .get<{ products: Product[]; total: number }>(
        `https://dummyjson.com/products/search`,
        { params: { q: query.q ?? '', limit, skip } }
      )
      .pipe(
        map((res: any) => {
          let filtered = [...res.products];

          // price filter
          if (query.priceMin) {
            filtered = filtered.filter((p) => p.price >= query.priceMin!);
          }
          if (query.priceMax) {
            filtered = filtered.filter((p) => p.price <= query.priceMax!);
          }

          // brand filter
          if (query.brands?.length) {
            filtered = filtered.filter((p) => query.brands!.includes(p.brand));
          }

          // stock only
          if (query.inStock) {
            filtered = filtered.filter((p) => p.stock > 0);
          }

          // sorting
          switch (query.sort) {
            case 'lh':
              filtered.sort((a, b) => a.price - b.price);
              break;

            case 'hl':
              filtered.sort((a, b) => b.price - a.price);
              break;

            case 'new':
            default:
              filtered.sort((a, b) => b.id - a.id);
              break;
          }

          return {
            products: filtered,
            total: res.total,
          };
        })
      );
  }
}
