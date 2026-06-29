import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export interface Product {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  image_urls: string[] | null;
  enhanced_image_urls: string[] | null;
  created_at: string | null;
}

export function useProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, title, short_description, long_description, category, tags, image_url, enhanced_image_url, image_urls, enhanced_image_urls, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductImage = (product: Product) => 
    product.enhanced_image_url || product.image_url || null;

  return { products, isLoading, refetch: fetchProducts, getProductImage };
}
