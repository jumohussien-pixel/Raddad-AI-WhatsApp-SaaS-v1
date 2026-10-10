import fs from 'fs';
import path from 'path';

export interface ProductItem {
  id: string;
  name: string;
  category: 'clothes' | 'sneakers';
  price: number;
  currency: string;
  sizes: string[];
  colors: string[];
  description: string;
  in_stock: boolean;
  sku?: string;
}

class ProductCatalogManager {
  private filePath: string;
  private products: ProductItem[] = [];

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data/products.json');
    this.loadProducts();
  }

  public loadProducts(): ProductItem[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.products = parsed;
          return this.products;
        }
      }
    } catch (err) {
      console.error('[ProductCatalog] Error loading products.json:', err);
    }
    return this.products;
  }

  public getProducts(): ProductItem[] {
    if (this.products.length === 0) {
      this.loadProducts();
    }
    return this.products;
  }

  public saveProducts(newProducts: ProductItem[]): boolean {
    try {
      this.products = newProducts;
      fs.writeFileSync(this.filePath, JSON.stringify(newProducts, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[ProductCatalog] Error saving products.json:', err);
      return false;
    }
  }

  public addProduct(product: Omit<ProductItem, 'id'>): ProductItem {
    const newItem: ProductItem = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    this.products.push(newItem);
    this.saveProducts(this.products);
    return newItem;
  }

  public updateProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.products[index] = { ...this.products[index], ...updates };
    this.saveProducts(this.products);
    return this.products[index];
  }

  public deleteProduct(id: string): boolean {
    const beforeCount = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    if (this.products.length !== beforeCount) {
      this.saveProducts(this.products);
      return true;
    }
    return false;
  }

  /**
   * Generates a dynamic markdown context for Gemini prompts
   * so the AI reads accurate products, sizes, prices, and stock
   * automatically from products.json without altering prompt code!
   */
  public generateCatalogPromptContext(): string {
    const items = this.getProducts().filter((p) => p.in_stock);
    if (items.length === 0) {
      return 'لا توجد منتجات متاحة حالياً في المخزن.';
    }

    const clothes = items.filter((p) => p.category === 'clothes');
    const sneakers = items.filter((p) => p.category === 'sneakers');

    let output = '=== كالوج المنتجات المعتمد والمتاح حالياً من products.json ===\n';

    if (clothes.length > 0) {
      output += '\n👕 قسم الملابس الشبابي:\n';
      for (const item of clothes) {
        output += `- ${item.name} | السعر: ${item.price} ${item.currency || 'جنيه'}\n`;
        output += `  • المقاسات المتوفرة: [${item.sizes.join(', ')}]\n`;
        output += `  • الألوان المتوفرة: [${item.colors.join(', ')}]\n`;
        output += `  • التفاصيل: ${item.description}\n`;
      }
    }

    if (sneakers.length > 0) {
      output += '\n👟 قسم الكوتشيات والسنيكرز:\n';
      for (const item of sneakers) {
        output += `- ${item.name} | السعر: ${item.price} ${item.currency || 'جنيه'}\n`;
        output += `  • المقاسات المتوفرة: [${item.sizes.join(', ')}]\n`;
        output += `  • الألوان: [${item.colors.join(', ')}]\n`;
        output += `  • التفاصيل: ${item.description}\n`;
      }
    }

    output += '\nسياسة المحل: متاح المعاينة والقياس مع المندوب قبل الاستلام، الدفع عند الاستلام (Cash on Delivery)، مصاريف الشحن لجميع المحافظات من 40 إلى 60 جنيه حسب العنوان.';
    return output;
  }
}

export const productCatalog = new ProductCatalogManager();
