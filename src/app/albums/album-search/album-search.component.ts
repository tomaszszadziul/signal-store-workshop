import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProgressBarComponent } from '@/shared/ui/progress-bar.component';
import { SortOrder } from '@/shared/models/sort-order.model';
import { Album, AlbumState, searchAlbums, sortAlbums } from '@/albums/album.model';
import { AlbumFilterComponent } from './album-filter/album-filter.component';
import { AlbumListComponent } from './album-list/album-list.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState, signalState } from '@ngrx/signals';
import { AlbumsService } from '../albums.service';

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

      <ngrx-album-list [albums]="albums" [showSpinner]="showSpinner()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlbumSearchComponent {
  readonly state = signalState({
    albums: [] as Album[],
    query: '',
    order: 'asc' as SortOrder,
    showProgress: false
    });
  
  readonly albums: Album[] = [
    {
      id: 1,
      title: 'Album 1',
      artist: 'Artist 1',
      releaseDate: '2023-01-01',
      genre: 'Genre 1',
      coverImage: '/assets/album-covers/unplugged.jpg',
    },
    {
      id: 2,
      title: 'Album 2',
      artist: 'Artist 2',
      releaseDate: '2024-01-01',
      genre: 'Genre 2',
      coverImage: '/assets/album-covers/are-you-experienced.jpg',
    },
  ];

  readonly #albumService = inject(AlbumsService);
  readonly #snackBar = inject(MatSnackBar);
  
  readonly showSpinner = computed(() => this.state.showProgress() && this.albums.length === 0);

  readonly filteredAlbums = computed(() => {
    const searchedAlbums = searchAlbums(this.albums, this.state.query());
    return sortAlbums(searchedAlbums, this.state.order());
  });
  
  readonly totalAlbums = computed(() => this.filteredAlbums().length);

  ngOnInit(): void {
    patchState(this.state,{showProgress: true});
    this.#albumService.getAll().subscribe({
      next: (albums : Album[]) => {
        patchState(this.state, {albums});
        patchState(this.state, {showProgress: false});
      },
      error: (error: any) => {
        console.error('Error loading albums', error);
        patchState(this.state, {showProgress: false});
      }
    })
  }

  updateQuery(query: string): void {
    patchState(this.state, {query});
  }

  updateOrder(order: SortOrder): void {
    patchState(this.state, {order});
  }
}
