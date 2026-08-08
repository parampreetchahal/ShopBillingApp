import {
    db,
    getBillItems,
    getBills,
    getProducts,
    getSettings,
} from "@/database/db";
import { supabase } from "@/lib/supabase";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type SyncResult = {
  success: boolean;
  message: string;

  productsUploaded: number;
  productsDownloaded: number;

  billsUploaded: number;
  billsDownloaded: number;

  billItemsUploaded: number;
  billItemsDownloaded: number;

  settingsUploaded: boolean;
  settingsDownloaded: boolean;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const now = () => new Date().toISOString();

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (error) {
      console.log("Auth Error:", error.message);
    }

    return null;
  }

  return user;
};

/*
|--------------------------------------------------------------------------
| Pull Products
|--------------------------------------------------------------------------
*/

const pullProducts = async (userId: string) => {
  const { data, error } = await supabase
    .from("shop_products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log("Download Products Error:", error);
    return 0;
  }

  if (!data) {
    return 0;
  }

  let downloaded = 0;

  for (const product of data) {
    try {
      const local = db.getFirstSync(
        "SELECT * FROM products WHERE cloud_id = ?",
        [product.id],
      ) as any;

      if (local) {
        db.runSync(
          `UPDATE products
           SET barcode = ?,
               name = ?,
               mrp = ?,
               updated_at = ?,
               sync_status = 'synced'
           WHERE cloud_id = ?`,
          [
            product.barcode,
            product.name,
            product.mrp,
            product.updated_at,
            product.id,
          ],
        );
      } else {
        /*
        ------------------------------------------------------------
        Check barcode as a safety net.
        ------------------------------------------------------------
        */

        const barcodeLocal = db.getFirstSync(
          "SELECT * FROM products WHERE barcode = ?",
          [product.barcode],
        ) as any;

        if (barcodeLocal) {
          /*
          ----------------------------------------------------------
          Existing local product.

          Associate it with the cloud record rather than
          creating a duplicate.
          ----------------------------------------------------------
          */

          db.runSync(
            `UPDATE products
             SET cloud_id = ?,
                 barcode = ?,
                 name = ?,
                 mrp = ?,
                 updated_at = ?,
                 sync_status = 'synced'
             WHERE id = ?`,
            [
              product.id,
              product.barcode,
              product.name,
              product.mrp,
              product.updated_at,
              barcodeLocal.id,
            ],
          );
        } else {
          db.runSync(
            `INSERT INTO products
             (barcode, name, mrp, cloud_id, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, 'synced')`,
            [
              product.barcode,
              product.name,
              product.mrp,
              product.id,
              product.updated_at,
            ],
          );
        }
      }

      downloaded++;
    } catch (error) {
      console.log("Product Restore Error:", error);
    }
  }

  return downloaded;
};

/*
|--------------------------------------------------------------------------
| Push Products
|--------------------------------------------------------------------------
*/

const pushProducts = async (userId: string) => {
  const products: any[] = getProducts() as any[];

  let uploaded = 0;

  for (const product of products) {
    try {
      /*
      --------------------------------------------------------------
      Deleted product
      --------------------------------------------------------------
      */

      if (product.sync_status === "deleted") {
        console.log("Attempting cloud deletion:", product.cloud_id);

        // Product was never uploaded to Supabase.
        if (!product.cloud_id) {
          db.runSync("DELETE FROM products WHERE id = ?", [product.id]);

          console.log("Deleted local-only product removed:", product.id);

          continue;
        }

        // Delete from Supabase and return the deleted row.
        const { data: deletedRows, error } = await supabase
          .from("shop_products")
          .delete()
          .eq("id", product.cloud_id)
          .eq("user_id", userId)
          .select("id");

        if (error) {
          console.log("Product Cloud Delete Error:", error);

          // Keep local tombstone.
          // It will retry during the next synchronization.
          continue;
        }

        // IMPORTANT:
        // No row returned means Supabase did not actually delete anything.
        if (!deletedRows || deletedRows.length === 0) {
          console.log("WARNING: Supabase deletion affected 0 rows.", {
            cloud_id: product.cloud_id,
            user_id: userId,
          });

          // Keep the local tombstone so we can retry.
          continue;
        }

        console.log("Confirmed cloud deletion:", deletedRows);

        // Only remove the local record AFTER
        // Supabase confirms the deletion.
        db.runSync("DELETE FROM products WHERE id = ?", [product.id]);

        console.log(
          "Product successfully deleted from Supabase:",
          product.cloud_id,
        );

        uploaded++;
        continue;
      }
      /*
      --------------------------------------------------------------
      Already synchronized
      --------------------------------------------------------------
      */

      if (product.sync_status === "synced" && product.cloud_id) {
        continue;
      }

      /*
      --------------------------------------------------------------
      Existing cloud ID
      --------------------------------------------------------------
      */

      if (product.cloud_id) {
        const { error } = await supabase
          .from("shop_products")
          .update({
            barcode: product.barcode,
            name: product.name,
            mrp: product.mrp,
            updated_at: now(),
          })
          .eq("id", product.cloud_id)
          .eq("user_id", userId);

        if (error) {
          console.log("Product Update Error:", error);
          continue;
        }

        db.runSync(
          `UPDATE products
           SET sync_status = 'synced',
               updated_at = ?
           WHERE id = ?`,
          [now(), product.id],
        );

        uploaded++;
        continue;
      }

      /*
      --------------------------------------------------------------
      No cloud ID.

      First check whether this barcode already belongs to this
      Google account.
      --------------------------------------------------------------
      */

      const { data: existingCloud, error: lookupError } = await supabase
        .from("shop_products")
        .select("id")
        .eq("user_id", userId)
        .eq("barcode", product.barcode)
        .maybeSingle();

      if (lookupError) {
        console.log("Product Lookup Error:", lookupError);
        continue;
      }

      if (existingCloud) {
        db.runSync(
          `UPDATE products
           SET cloud_id = ?,
               sync_status = 'synced'
           WHERE id = ?`,
          [existingCloud.id, product.id],
        );

        uploaded++;
        continue;
      }

      /*
      --------------------------------------------------------------
      Create new cloud product
      --------------------------------------------------------------
      */

      const { data, error } = await supabase
        .from("shop_products")
        .insert({
          user_id: userId,
          barcode: product.barcode,
          name: product.name,
          mrp: product.mrp,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.log("Product Insert Error:", error);
        continue;
      }

      db.runSync(
        `UPDATE products
         SET cloud_id = ?,
             sync_status = 'synced',
             updated_at = ?
         WHERE id = ?`,
        [data.id, now(), product.id],
      );

      uploaded++;
    } catch (error) {
      console.log("Product Push Error:", error);
    }
  }

  return uploaded;
};

/*
|--------------------------------------------------------------------------
| Pull Bills
|--------------------------------------------------------------------------
*/

const pullBills = async (userId: string) => {
  const { data, error } = await supabase
    .from("shop_bills")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log("Download Bills Error:", error);
    return 0;
  }

  if (!data) {
    return 0;
  }

  let downloaded = 0;

  for (const bill of data) {
    try {
      const local = db.getFirstSync("SELECT * FROM bills WHERE cloud_id = ?", [
        bill.id,
      ]) as any;

      if (local) {
        db.runSync(
          `UPDATE bills
           SET invoice_number = ?,
               customer_name = ?,
               mobile = ?,
               date = ?,
               time = ?,
               total = ?,
               updated_at = ?,
               sync_status = 'synced'
           WHERE cloud_id = ?`,
          [
            bill.invoice_number,
            bill.customer_name,
            bill.mobile,
            bill.date,
            bill.time,
            bill.total,
            bill.created_at,
            bill.id,
          ],
        );
      } else {
        db.runSync(
          `INSERT INTO bills
           (
             invoice_number,
             customer_name,
             mobile,
             date,
             time,
             total,
             cloud_id,
             updated_at,
             sync_status
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
          [
            bill.invoice_number,
            bill.customer_name,
            bill.mobile,
            bill.date,
            bill.time,
            bill.total,
            bill.id,
            bill.created_at,
          ],
        );
      }

      downloaded++;
    } catch (error) {
      console.log("Bill Restore Error:", error);
    }
  }

  return downloaded;
};

/*
|--------------------------------------------------------------------------
| Push Bills
|--------------------------------------------------------------------------
*/

const pushBills = async (userId: string) => {
  const bills: any[] = getBills() as any[];

  let uploaded = 0;

  for (const bill of bills) {
    try {
      if (bill.sync_status === "synced" && bill.cloud_id) {
        continue;
      }

      /*
      --------------------------------------------------------------
      Existing cloud bill
      --------------------------------------------------------------
      */

      if (bill.cloud_id) {
        const { error } = await supabase
          .from("shop_bills")
          .update({
            invoice_number: bill.invoice_number,
            customer_name: bill.customer_name,
            mobile: bill.mobile,
            date: bill.date,
            time: bill.time,
            total: bill.total,
          })
          .eq("id", bill.cloud_id)
          .eq("user_id", userId);

        if (error) {
          console.log("Bill Update Error:", error);
          continue;
        }

        db.runSync(
          `UPDATE bills
           SET sync_status = 'synced',
               updated_at = ?
           WHERE id = ?`,
          [now(), bill.id],
        );

        uploaded++;
        continue;
      }

      /*
      --------------------------------------------------------------
      Create cloud bill
      --------------------------------------------------------------
      */

      const { data, error } = await supabase
        .from("shop_bills")
        .insert({
          user_id: userId,
          invoice_number: bill.invoice_number,
          customer_name: bill.customer_name,
          mobile: bill.mobile,
          date: bill.date,
          time: bill.time,
          total: bill.total,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.log("Bill Insert Error:", error);
        continue;
      }

      db.runSync(
        `UPDATE bills
         SET cloud_id = ?,
             sync_status = 'synced',
             updated_at = ?
         WHERE id = ?`,
        [data.id, now(), bill.id],
      );

      uploaded++;
    } catch (error) {
      console.log("Bill Push Error:", error);
    }
  }

  return uploaded;
};

/*
|--------------------------------------------------------------------------
| Pull Bill Items
|--------------------------------------------------------------------------
*/

const pullBillItems = async (userId: string) => {
  const { data, error } = await supabase
    .from("shop_bill_items")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.log("Download Bill Items Error:", error);
    return 0;
  }

  if (!data) {
    return 0;
  }

  let downloaded = 0;

  for (const item of data) {
    try {
      /*
      --------------------------------------------------------------
      Find local parent bill using cloud bill ID
      --------------------------------------------------------------
      */

      const localBill = db.getFirstSync(
        "SELECT id FROM bills WHERE cloud_id = ?",
        [item.bill_id],
      ) as any;

      if (!localBill) {
        console.log(
          "Skipping bill item because parent bill is missing:",
          item.id,
        );

        continue;
      }

      /*
      --------------------------------------------------------------
      Existing item
      --------------------------------------------------------------
      */

      const localItem = db.getFirstSync(
        "SELECT * FROM bill_items WHERE cloud_id = ?",
        [item.id],
      ) as any;

      if (localItem) {
        db.runSync(
          `UPDATE bill_items
           SET bill_id = ?,
               barcode = ?,
               product_name = ?,
               quantity = ?,
               price = ?,
               total = ?,
               updated_at = ?,
               sync_status = 'synced'
           WHERE cloud_id = ?`,
          [
            localBill.id,
            item.barcode,
            item.product_name,
            item.quantity,
            item.price,
            item.total,
            now(),
            item.id,
          ],
        );
      } else {
        db.runSync(
          `INSERT INTO bill_items
           (
             bill_id,
             barcode,
             product_name,
             quantity,
             price,
             total,
             cloud_id,
             updated_at,
             sync_status
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
          [
            localBill.id,
            item.barcode,
            item.product_name,
            item.quantity,
            item.price,
            item.total,
            item.id,
            now(),
          ],
        );
      }

      downloaded++;
    } catch (error) {
      console.log("Bill Item Restore Error:", error);
    }
  }

  return downloaded;
};

/*
|--------------------------------------------------------------------------
| Push Bill Items
|--------------------------------------------------------------------------
*/

const pushBillItems = async (userId: string) => {
  const bills: any[] = getBills() as any[];

  let uploaded = 0;

  for (const bill of bills) {
    if (!bill.cloud_id) {
      continue;
    }

    const items: any[] = getBillItems(Number(bill.id)) as any[];

    for (const item of items) {
      try {
        if (item.sync_status === "synced" && item.cloud_id) {
          continue;
        }

        /*
        ------------------------------------------------------------
        Existing cloud item
        ------------------------------------------------------------
        */

        if (item.cloud_id) {
          const { error } = await supabase
            .from("shop_bill_items")
            .update({
              barcode: item.barcode,
              product_name: item.product_name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })
            .eq("id", item.cloud_id)
            .eq("user_id", userId);

          if (error) {
            console.log("Bill Item Update Error:", error);
            continue;
          }

          db.runSync(
            `UPDATE bill_items
             SET sync_status = 'synced',
                 updated_at = ?
             WHERE id = ?`,
            [now(), item.id],
          );

          uploaded++;
          continue;
        }

        /*
        ------------------------------------------------------------
        Create cloud item
        ------------------------------------------------------------
        */

        const { data, error } = await supabase
          .from("shop_bill_items")
          .insert({
            bill_id: bill.cloud_id,
            user_id: userId,
            barcode: item.barcode,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })
          .select("id")
          .single();

        if (error || !data) {
          console.log("Bill Item Insert Error:", error);
          continue;
        }

        db.runSync(
          `UPDATE bill_items
           SET cloud_id = ?,
               sync_status = 'synced',
               updated_at = ?
           WHERE id = ?`,
          [data.id, now(), item.id],
        );

        uploaded++;
      } catch (error) {
        console.log("Bill Item Push Error:", error);
      }
    }
  }

  return uploaded;
};

/*
|--------------------------------------------------------------------------
| Pull Settings
|--------------------------------------------------------------------------
*/

const pullSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("Download Settings Error:", error);
    return false;
  }

  if (!data) {
    return false;
  }

  try {
    const existing = getSettings();

    if (existing) {
      db.runSync(
        `UPDATE settings
         SET shop_name = ?,
             owner_name = ?,
             phone = ?,
             address = ?,
             gst = ?,
             upi = ?,
             updated_at = ?,
             sync_status = 'synced'
         WHERE id = 1`,
        [
          data.shop_name || "",
          data.owner_name || "",
          data.phone || "",
          data.address || "",
          data.gst || "",
          data.upi || "",
          data.updated_at,
        ],
      );
    } else {
      db.runSync(
        `INSERT INTO settings
         (
           id,
           shop_name,
           owner_name,
           phone,
           address,
           gst,
           upi,
           updated_at,
           sync_status
         )
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
        [
          data.shop_name || "",
          data.owner_name || "",
          data.phone || "",
          data.address || "",
          data.gst || "",
          data.upi || "",
          data.updated_at,
        ],
      );
    }

    return true;
  } catch (error) {
    console.log("Settings Restore Error:", error);
    return false;
  }
};

/*
|--------------------------------------------------------------------------
| Push Settings
|--------------------------------------------------------------------------
*/

const pushSettings = async (userId: string) => {
  const settings: any = getSettings();

  if (!settings) {
    return false;
  }

  try {
    /*
    --------------------------------------------------------------
    Only push when local data is pending.
    --------------------------------------------------------------
    */

    if (settings.sync_status === "synced") {
      return false;
    }

    const { error } = await supabase.from("shop_settings").upsert(
      {
        user_id: userId,
        shop_name: settings.shop_name || "",
        owner_name: settings.owner_name || "",
        phone: settings.phone || "",
        address: settings.address || "",
        gst: settings.gst || "",
        upi: settings.upi || "",
        updated_at: now(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.log("Settings Upload Error:", error);
      return false;
    }

    db.runSync(
      `UPDATE settings
       SET sync_status = 'synced',
           updated_at = ?
       WHERE id = 1`,
      [now()],
    );

    return true;
  } catch (error) {
    console.log("Settings Upload Error:", error);
    return false;
  }
};

/*
|--------------------------------------------------------------------------
| Main Synchronization
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| 1. Push local pending data first.
| 2. Pull cloud data afterwards.
|
| This prevents a pending local change from being overwritten
| immediately during synchronization.
|--------------------------------------------------------------------------
*/

export const syncEverything = async (): Promise<SyncResult> => {
  const emptyResult: SyncResult = {
    success: true,
    message: "Offline mode",

    productsUploaded: 0,
    productsDownloaded: 0,

    billsUploaded: 0,
    billsDownloaded: 0,

    billItemsUploaded: 0,
    billItemsDownloaded: 0,

    settingsUploaded: false,
    settingsDownloaded: false,
  };

  try {
    const user = await getCurrentUser();

    if (!user) {
      return emptyResult;
    }

    console.log("========================================");
    console.log("Starting cloud synchronization...");
    console.log("User:", user.id);
    console.log("========================================");

    /*
    |--------------------------------------------------------------------------
    | STEP 1
    | Push local pending data
    |--------------------------------------------------------------------------
    */

    const productsUploaded = await pushProducts(user.id);

    const billsUploaded = await pushBills(user.id);

    /*
    Bills must exist before bill items can be uploaded.
    */

    const billItemsUploaded = await pushBillItems(user.id);

    const settingsUploaded = await pushSettings(user.id);

    /*
    |--------------------------------------------------------------------------
    | STEP 2
    | Pull cloud data
    |--------------------------------------------------------------------------
    */

    const productsDownloaded = await pullProducts(user.id);

    const billsDownloaded = await pullBills(user.id);

    const billItemsDownloaded = await pullBillItems(user.id);

    const settingsDownloaded = await pullSettings(user.id);

    console.log("========================================");
    console.log("Cloud synchronization completed");
    console.log({
      productsUploaded,
      productsDownloaded,
      billsUploaded,
      billsDownloaded,
      billItemsUploaded,
      billItemsDownloaded,
      settingsUploaded,
      settingsDownloaded,
    });
    console.log("========================================");

    return {
      success: true,
      message: "Synchronization completed",

      productsUploaded,
      productsDownloaded,

      billsUploaded,
      billsDownloaded,

      billItemsUploaded,
      billItemsDownloaded,

      settingsUploaded,
      settingsDownloaded,
    };
  } catch (error) {
    console.log("Synchronization Error:", error);

    return {
      success: false,
      message: "Synchronization failed",

      productsUploaded: 0,
      productsDownloaded: 0,

      billsUploaded: 0,
      billsDownloaded: 0,

      billItemsUploaded: 0,
      billItemsDownloaded: 0,

      settingsUploaded: false,
      settingsDownloaded: false,
    };
  }
};
