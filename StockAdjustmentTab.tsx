import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Minus, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProductWithFabricant } from "@shared/schema";
import { getProductNameClass } from "@/lib/productUtils";

export default function StockAdjustmentTab() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<ProductWithFabricant[]>({
    queryKey: ["/api/products"],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newQuantity }: { productId: string; newQuantity: number }) => {
      return apiRequest("PATCH", `/api/products/${productId}`, { quantity: newQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const handleAdjustStock = (operation: "add" | "remove") => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit et entrer une quantité valide.",
        variant: "destructive",
      });
      return;
    }

    const newQuantity = operation === "add" 
      ? selectedProduct.quantity + quantity 
      : Math.max(0, selectedProduct.quantity - quantity);

    updateStockMutation.mutate(
      { productId: selectedProductId, newQuantity },
      {
        onSuccess: () => {
          toast({
            title: "Stock mis à jour",
            description: `${selectedProduct.name}: ${operation === "add" ? "+" : "-"}${quantity} → Nouveau stock: ${newQuantity}`,
          });
          setQuantity(1);
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour le stock.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const groupedProducts = products?.reduce((acc, product) => {
    const fabricantName = product.fabricant?.name || "Sans fabricant";
    if (!acc[fabricantName]) {
      acc[fabricantName] = [];
    }
    acc[fabricantName].push(product);
    return acc;
  }, {} as Record<string, ProductWithFabricant[]>);

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Ajustement de Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="product-select">Produit</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                disabled={isLoading}
              >
                <SelectTrigger id="product-select" data-testid="select-product">
                  <SelectValue placeholder="Sélectionner un produit..." />
                </SelectTrigger>
                <SelectContent>
                  {groupedProducts && Object.entries(groupedProducts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([fabricantName, prods]) => (
                      <div key={fabricantName}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          {fabricantName}
                        </div>
                        {prods.map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            data-testid={`select-item-${product.id}`}
                          >
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span className={getProductNameClass(product.name)}>{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                (Stock: {product.quantity})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity-input">Quantité</Label>
              <Input
                id="quantity-input"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                data-testid="input-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAdjustStock("add")}
                  disabled={!selectedProductId || updateStockMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-add-stock"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
                <Button
                  onClick={() => handleAdjustStock("remove")}
                  disabled={!selectedProductId || updateStockMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-remove-stock"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Retirer
                </Button>
              </div>
            </div>
          </div>

          {selectedProduct && (
            <Card className="bg-muted/30 border-white/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${getProductNameClass(selectedProduct.name)}`}>{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.fabricant?.name || "Sans fabricant"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {selectedProduct.quantity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stock actuel
                    </div>
                  </div>
                  {selectedProduct.maintenance > 0 && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-500">
                        {selectedProduct.maintenance}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        En maintenance
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
