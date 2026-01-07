import { Component, computed, signal, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService, Product } from '../service/products-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, map, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new.html',
  styleUrl: './new.css'
})
export class New {

  readonly pageSize = 12;

  ui = signal({
    brands: [] as string[],
    inStock: false,
    priceMin: 0,
    priceMax: 0,
    sort: 'new',
    search: ''
  });

  data!: Signal<any | null>;
  productList!: Signal<Product[]>;
  total!: Signal<number>;
  currentPage!: Signal<number>;
  totalPages!: Signal<number>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService
  ) {

    this.data = toSignal<any | null>(
      this.route.queryParamMap.pipe(
        map(params => {
console.log(params);

          const query = {
            page: +(params.get('page') ?? 1),
            q: params.get('q') ?? '',
            sort: params.get('sort') ?? 'new',
            priceMin: +(params.get('min') ?? 0),
            priceMax: +(params.get('max') ?? 0),
            inStock: params.get('stock') === '1',
            brands: params.getAll('brand')
          };

          this.ui.update(v => ({
            ...v,
            search: query.q,
            inStock: query.inStock,
            priceMin: query.priceMin,
            priceMax: query.priceMax,
            brands: query.brands,
            sort: query.sort
          }));

          return query;
        }),
        debounceTime(300),
        switchMap(q => this.productsService.fetchPlp(q))
      ),
      { initialValue: null }
    );

    this.productList = computed<Product[]>(
      () => this.data()?.products ?? []
    );

    this.total = computed<number>(
      () => this.data()?.total ?? 0
    );

    this.currentPage = computed<number>(
      () => +(this.route.snapshot.queryParamMap.get('page') ?? 1)
    );

    this.totalPages = computed<number>(
      () => Math.ceil(this.total() / this.pageSize)
    );
  }

  updateParams(params: object) {
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  onSearch(q: string) {
    this.updateParams({ q, page: 1 });
  }

  toggleBrand(brand: string) {
    const brands = [...this.ui().brands];
    const i = brands.indexOf(brand);
    i >= 0 ? brands.splice(i, 1) : brands.push(brand);

    this.updateParams({ brand: brands, page: 1 });
  }

  toggleStock(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.updateParams({ stock: checked ? 1 : null, page: 1 });
  }

  changeSort(sort: string) {
    this.updateParams({ sort, page: 1 });
  }

  changePage(page: number) {
    this.updateParams({ page });
  }
}
