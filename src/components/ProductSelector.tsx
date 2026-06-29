import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Product } from "@/hooks/useProducts";

interface ProductSelectorProps {
  products: Product[];
  isLoading: boolean;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  getProductImage?: (product: Product) => string | null;
}

export function ProductSelector({
  products,
  isLoading,
  value,
  onValueChange,
  placeholder = "Select a product",
  allowNone = true,
  getProductImage,
}: ProductSelectorProps) {
  const imgSrc = (p: Product) => getProductImage?.(p) ?? p.enhanced_image_url ?? p.image_url;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading products…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value="none">— None (enter manually) —</SelectItem>
        )}
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            <span className="flex items-center gap-2">
              {imgSrc(product) && (
                <img
                  src={imgSrc(product)!}
                  alt=""
                  className="w-6 h-6 rounded object-cover inline-block"
                />
              )}
              <span className="truncate">{product.title}</span>
            </span>
          </SelectItem>
        ))}
        {!isLoading && products.length === 0 && (
          <SelectItem value="none" disabled>
            No products yet
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
