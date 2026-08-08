import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("shop.db");

/*
|--------------------------------------------------------------------------
| Database Helpers
|--------------------------------------------------------------------------
*/

const columnExists = (tableName: string, columnName: string) => {
  try {
    const columns = db.getAllSync(`PRAGMA table_info(${tableName})`) as any[];

    return columns.some((column) => column.name === columnName);
  } catch (error) {
    console.log(`Could not check column ${columnName} in ${tableName}:`, error);

    return false;
  }
};

const addColumnIfMissing = (
  tableName: string,
  columnName: string,
  columnDefinition: string,
) => {
  try {
    if (!columnExists(tableName, columnName)) {
      db.execSync(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
      );

      console.log(`Added ${columnName} to ${tableName}`);
    }
  } catch (error) {
    console.log(`Could not add ${columnName} to ${tableName}:`, error);
  }
};

/*
|--------------------------------------------------------------------------
| Initialize Database
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We DO NOT DROP TABLES here.
|
| This function can safely run every time the app starts.
|
*/

export const initDatabase = () => {
  try {
    /*
    ----------------------------------------------------------------------
    Base tables
    ----------------------------------------------------------------------
    */

    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mrp REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        total REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        barcode TEXT,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (bill_id) REFERENCES bills(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        shop_name TEXT,
        owner_name TEXT,
        phone TEXT,
        address TEXT,
        gst TEXT,
        upi TEXT
      );
    `);

    /*
    ----------------------------------------------------------------------
    Sync columns
    ----------------------------------------------------------------------

    These will be used later for Supabase synchronization.

    Existing records are NOT deleted.
    */

    addColumnIfMissing("products", "cloud_id", "TEXT");

    addColumnIfMissing("products", "updated_at", "TEXT");

    addColumnIfMissing("products", "sync_status", "TEXT DEFAULT 'pending'");

    addColumnIfMissing("bills", "cloud_id", "TEXT");

    addColumnIfMissing("bills", "updated_at", "TEXT");

    addColumnIfMissing("bills", "sync_status", "TEXT DEFAULT 'pending'");

    addColumnIfMissing("bill_items", "cloud_id", "TEXT");

    addColumnIfMissing("bill_items", "updated_at", "TEXT");

    addColumnIfMissing("bill_items", "sync_status", "TEXT DEFAULT 'pending'");

    addColumnIfMissing("settings", "cloud_id", "TEXT");

    addColumnIfMissing("settings", "updated_at", "TEXT");

    addColumnIfMissing("settings", "sync_status", "TEXT DEFAULT 'pending'");

    /*
    ----------------------------------------------------------------------
    Existing records
    ----------------------------------------------------------------------
    */

    db.runSync(
      `UPDATE products
       SET sync_status = 'pending'
       WHERE sync_status IS NULL`,
    );

    db.runSync(
      `UPDATE bills
       SET sync_status = 'pending'
       WHERE sync_status IS NULL`,
    );

    db.runSync(
      `UPDATE bill_items
       SET sync_status = 'pending'
       WHERE sync_status IS NULL`,
    );

    db.runSync(
      `UPDATE settings
       SET sync_status = 'pending'
       WHERE sync_status IS NULL`,
    );

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("DB Error:", error);
  }
};

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

export const addProduct = (barcode: string, name: string, mrp: number) => {
  try {
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO products
       (barcode, name, mrp, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?)`,
      [barcode, name, mrp, now, "pending"],
    );

    return {
      success: true,
      message: "Product Added",
    };
  } catch (error: any) {
    if (String(error).includes("UNIQUE")) {
      return {
        success: false,
        message: "Product already exists.",
      };
    }

    console.log("Insert Error:", error);

    return {
      success: false,
      message: "Could not save product.",
    };
  }
};

export const getProducts = () => {
  try {
    return db.getAllSync("SELECT * FROM products ORDER BY id DESC");
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const deleteProduct = (id: number) => {
  try {
    const product: any = db.getFirstSync(
      "SELECT * FROM products WHERE id = ?",
      [id],
    );

    if (!product) {
      console.log("Delete Error: Product not found");
      return false;
    }

    const now = new Date().toISOString();

    /*
     * If the product has never been uploaded to Supabase,
     * there is nothing to delete from the cloud.
     *
     * We can safely remove it locally.
     */
    if (!product.cloud_id) {
      db.runSync("DELETE FROM products WHERE id = ?", [id]);

      console.log("Product deleted locally. It had no cloud record.");

      return true;
    }

    /*
     * Product already exists in Supabase.
     *
     * Keep the local row as a deletion tombstone until
     * syncEverything() removes it from Supabase.
     */
    db.runSync(
      `UPDATE products
       SET sync_status = 'deleted',
           updated_at = ?
       WHERE id = ?`,
      [now, id],
    );

    console.log("Product marked as deleted and pending cloud deletion.");

    return true;
  } catch (error) {
    console.log("Delete Error:", error);
    return false;
  }
};

export const updateProduct = (
  id: number,
  barcode: string,
  name: string,
  mrp: number,
) => {
  try {
    const now = new Date().toISOString();

    db.runSync(
      `UPDATE products
       SET barcode = ?,
           name = ?,
           mrp = ?,
           updated_at = ?,
           sync_status = 'pending'
       WHERE id = ?`,
      [barcode, name, mrp, now, id],
    );

    console.log("Product Updated");

    return true;
  } catch (error) {
    console.log("Update Error:", error);
    return false;
  }
};

export const clearLocalShopData = () => {
  try {
    console.log("========================================");
    console.log("Clearing local shop data for account switch...");

    db.runSync("DELETE FROM bill_items");
    db.runSync("DELETE FROM bills");
    db.runSync("DELETE FROM products");
    db.runSync("DELETE FROM settings");

    console.log("Local shop data cleared successfully.");
    console.log("========================================");

    return true;
  } catch (error) {
    console.log("Error clearing local shop data:", error);
    return false;
  }
};

export const getProductByBarcode = (barcode: string) => {
  try {
    return db.getFirstSync("SELECT * FROM products WHERE barcode = ?", [
      barcode,
    ]);
  } catch (error) {
    console.log(error);
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Bills
|--------------------------------------------------------------------------
*/

export const saveBill = (
  invoiceNumber: string,
  customerName: string,
  mobile: string,
  date: string,
  time: string,
  total: number,
) => {
  try {
    const now = new Date().toISOString();

    const result = db.runSync(
      `INSERT INTO bills
       (
         invoice_number,
         customer_name,
         mobile,
         date,
         time,
         total,
         updated_at,
         sync_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customerName, mobile, date, time, total, now, "pending"],
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.log("Save Bill Error:", error);
    return null;
  }
};

export const saveBillItem = (
  billId: number,
  barcode: string,
  productName: string,
  quantity: number,
  price: number,
  total: number,
) => {
  try {
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO bill_items
       (
         bill_id,
         barcode,
         product_name,
         quantity,
         price,
         total,
         updated_at,
         sync_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [billId, barcode, productName, quantity, price, total, now, "pending"],
    );
    return true;
  } catch (error) {
    console.log("Save Bill Item Error:", error);
    return false;
  }
};

export const getBills = () => {
  try {
    return db.getAllSync("SELECT * FROM bills ORDER BY id DESC");
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getBillItems = (billId: number) => {
  try {
    return db.getAllSync("SELECT * FROM bill_items WHERE bill_id = ?", [
      billId,
    ]);
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getBillById = (billId: number) => {
  try {
    return db.getFirstSync("SELECT * FROM bills WHERE id = ?", [billId]);
  } catch (error) {
    console.log(error);
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

export const getSettings = () => {
  try {
    return db.getFirstSync("SELECT * FROM settings WHERE id = 1");
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const saveSettings = (
  shopName: string,
  ownerName: string,
  phone: string,
  address: string,
  gst: string,
  upi: string,
) => {
  try {
    const existing = getSettings();
    const now = new Date().toISOString();

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
             sync_status = 'pending'
         WHERE id = 1`,
        [shopName, ownerName, phone, address, gst, upi, now],
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
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shopName, ownerName, phone, address, gst, upi, now, "pending"],
      );
    }

    return true;
  } catch (error) {
    console.log("Save Settings Error:", error);
    return false;
  }
};
