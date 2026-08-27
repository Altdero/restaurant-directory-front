import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { MENU_ITEM_DATA, RESTAURANT_DATA } from '@core/interfaces/tokens';
import { ApiError } from '@core/models/api-error.model';
import { MenuItem } from '@core/models/menu-item.model';
import { CloudinaryUploadService } from '@core/services/upload/cloudinary-upload.service';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { MenuItemForm, MenuItemFormValue } from '@features/owner/menu-item-form/menu-item-form';
import { MenuItemTable } from '@features/owner/menu-item-table/menu-item-table';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ErrorState } from '@shared/components/error-state/error-state';
import { firstValueFrom } from 'rxjs';

/** Menu items fetched flat with `limit: 100` — no pagination UI, same reasoning as commit 12's `RestaurantDetailPage` (restaurant menus are small in practice). */
const MENU_ITEM_LIMIT = 100;

/**
 * `/my/restaurants/:id/menu` — an inline create/edit form on one page,
 * not a separate route, mirroring `RestaurantDetailPage`'s `ReviewForm`
 * pattern exactly: `editingItem` presence decides create-vs-edit (plays
 * `myReview`'s role), `isFormOpen` gates visibility separately since
 * create mode also needs the form open with no item selected.
 *
 * Owns the Cloudinary upload the same way `RestaurantFormPage` does —
 * `MenuItemForm` only re-emits the selected `File`.
 */
@Component({
  selector: 'app-menu-manager-page',
  imports: [RouterLink, MatButtonModule, MenuItemForm, MenuItemTable, ErrorState],
  templateUrl: './menu-manager-page.html',
  styles: `
    .menu-manager-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 40rem;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .breadcrumb a {
      color: inherit;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: var(--mat-sys-primary);
    }

    h1 {
      font-size: 2.375rem;
      margin: 0;
    }

    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
  `,
})
export class MenuManagerPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly menuItemData = inject(MENU_ITEM_DATA);
  private readonly uploadService = inject(CloudinaryUploadService);
  private readonly dialog = inject(MatDialog);

  readonly id = input<string>();

  protected readonly restaurant = this.restaurantData.byId(this.id);
  /** `resource.value()` re-throws once a resource has failed — same guard as every other smart page since commit 14's fix. */
  protected readonly restaurantValue = computed(() =>
    this.restaurant.error() ? undefined : this.restaurant.value(),
  );

  private readonly menuItemsQuery = computed(() => ({
    restaurantId: this.id(),
    limit: MENU_ITEM_LIMIT,
  }));
  protected readonly menuItems = this.menuItemData.list(this.menuItemsQuery);
  protected readonly menuItemsPage = computed(() =>
    this.menuItems.error() ? undefined : this.menuItems.value(),
  );

  private readonly createMutation = this.menuItemData.create();
  private readonly updateMutation = this.menuItemData.update();
  private readonly removeMutation = this.menuItemData.remove();

  protected readonly isFormOpen = signal(false);
  protected readonly editingItem = signal<MenuItem | undefined>(undefined);
  protected readonly formPending = computed(
    () => this.createMutation.isPending() || this.updateMutation.isPending(),
  );
  protected readonly formError = signal<ApiError | undefined>(undefined);
  protected readonly apiErrorMessage = apiErrorMessage;

  private readonly uploadedImage = signal<string | undefined>(undefined);
  protected readonly imageUrl = computed(
    () => this.uploadedImage() ?? this.editingItem()?.image ?? '',
  );
  protected readonly isUploadingImage = signal(false);

  protected openCreateForm(): void {
    this.editingItem.set(undefined);
    this.uploadedImage.set(undefined);
    this.formError.set(undefined);
    this.isFormOpen.set(true);
  }

  protected openEditForm(item: MenuItem): void {
    this.editingItem.set(item);
    this.uploadedImage.set(undefined);
    this.formError.set(undefined);
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
    this.editingItem.set(undefined);
  }

  protected async onImageSelected(file: File): Promise<void> {
    this.isUploadingImage.set(true);
    try {
      this.uploadedImage.set(await this.uploadService.upload(file, 'menu-items'));
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  protected async submit(value: MenuItemFormValue): Promise<void> {
    const restaurantId = this.id();
    if (!restaurantId) {
      return;
    }
    this.formError.set(undefined);
    try {
      const existing = this.editingItem();
      if (existing) {
        await this.updateMutation.mutate({ id: existing.id, body: value });
      } else {
        await this.createMutation.mutate({ restaurant: restaurantId, ...value });
      }
    } catch (error) {
      this.formError.set(error as ApiError);
      return;
    }
    this.closeForm();
    this.menuItems.reload();
  }

  protected async deleteItem(item: MenuItem): Promise<void> {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: $localize`:@@menuManagerPage.deleteTitle:Delete ${item.name}:name:?`,
        message: $localize`:@@menuManagerPage.deleteMessage:This can't be undone.`,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) {
      return;
    }
    try {
      await this.removeMutation.mutate(item.id);
    } catch {
      return;
    }
    this.menuItems.reload();
  }
}
