import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState, signalState } from '@ngrx/signals';
import { ProgressBarComponent } from '@/shared/ui/progress-bar.component';
import { SortOrder } from '@/shared/models/sort-order.model';
import { AlbumsService } from '@/albums/albums.service';
import { Album, searchAlbums, sortAlbums } from '@/albums/album.model';
import { AlbumFilterComponent } from './album-filter/album-filter.component';
import { AlbumListComponent } from './album-list/album-list.component';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, exhaustMap, pipe, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

@Component({
  selector: 'ngrx-album-search',
  standalone: true,
  imports: [ProgressBarComponent, AlbumFilterComponent, AlbumListComponent],
  template: `
    <ngrx-progress-bar [showProgress]="state.showProgress()" />

    <div class="container">
      <h1>Albums ({{ totalAlbums() }})</h1>

      <ngrx-album-filter
        [query]="state.query()"
        [order]="state.order()"
        (queryChange)="updateQuery($event)"
        (orderChange)="updateOrder($event)"
      />

      <ngrx-album-list
        [albums]="filteredAlbums()"
        [showSpinner]="showSpinner()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export default class AlbumSearchComponent implements OnInit {
  readonly #albumsService = inject(AlbumsService);
  readonly #snackBar = inject(MatSnackBar);

  readonly state = signalState({
    albums: [] as Album[],
    showProgress: false,
    query: '',
    order: 'asc' as SortOrder,
  });

  readonly filteredAlbums = computed(() => {
    const searchedAlbums = searchAlbums(
      this.state.albums(),
      this.state.query(),
    );

    return sortAlbums(searchedAlbums, this.state.order());
  });
  readonly showSpinner = computed(
    () => this.state.showProgress() && this.state.albums().length === 0,
  );
  readonly totalAlbums = computed(() => this.filteredAlbums().length);

  readonly loadAllAlbums = rxMethod<void>(
    pipe(
      tap(() => patchState(this.state, { showProgress: true })),
      exhaustMap((albumsService) => this.#albumsService.getAll().pipe(
        tapResponse({
          next: (albums) => {
            patchState(this.state, { albums });
          },
          error: (error: { message: string }) => {
            patchState(this.state, { showProgress: false });
            this.#snackBar.open('Error loading albums', 'Close', {
              duration: 3000,
            });
          }
        })
      ))
    )
    )

  ngOnInit(): void {
    patchState(this.state, { showProgress: true });
    this.loadAllAlbums();
  }

  updateQuery(query: string): void {
    patchState(this.state, { query });
  }

  updateOrder(order: SortOrder): void {
    patchState(this.state, { order });
  }
}
