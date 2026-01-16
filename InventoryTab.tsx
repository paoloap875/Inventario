import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Minus, Pencil, Trash2, Download, Filter, Factory, ChevronDown, ChevronRight, Package, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithFabricant, Fabricant } from "@shared/schema";
import { getProductNameClass } from "@/lib/productUtils";
import ProductDialog from "./ProductDialog";
import FabricantDialog from "./FabricantDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

export default function InventoryTab() {
  const { toast } = useToast();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [fabricantDialogOpen, setFabricantDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithFabricant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithFabricant | null>(null);
  const [filterFabricant, setFilterFabricant] = useState<string>("all");
  const [expandedFabricants, setExpandedFabricants] = useState<Set<string>>(new Set());

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithFabricant[]>({
    queryKey: ["/api/products"],
  });

  const { data: fabricants } = useQuery<Fabricant[]>({
    queryKey: ["/api/fabricants"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit supprimé", description: "Le produit a été supprimé avec succès." });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      await apiRequest("PATCH", `/api/products/${id}/maintenance`, { delta });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier la maintenance.", variant: "destructive" });
    },
  });

  const handleEditProduct = (product: ProductWithFabricant) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: ProductWithFabricant) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      toast({ title: "Aucun produit", description: "Il n'y a aucun produit à exporter.", variant: "destructive" });
      return;
    }

    const headers = ["Nom", "Fabricant", "Quantité", "Maintenance", "Disponible", "Description"];
    const rows = products.map(p => [
      p.name,
      p.fabricant?.name || "",
      p.quantity.toString(),
      (p.maintenance || 0).toString(),
      (p.quantity - (p.maintenance || 0)).toString(),
      p.description || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventaire.csv";
    link.click();
    URL.revokeObjectURL(link.href);

    toast({ title: "Export réussi", description: "L'inventaire a été exporté en CSV." });
  };

  const filteredProducts = products?.filter(product => {
    if (filterFabricant !== "all" && product.fabricantId !== filterFabricant) return false;
    return true;
  });

  const groupedProducts = useMemo(() => {
    if (!filteredProducts || !fabricants) return [];
    
    const grouped: { fabricant: Fabricant; products: ProductWithFabricant[] }[] = [];
    
    // Trier les fabricants par nom
    const sortedFabricants = [...fabricants].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    
    sortedFabricants.forEach(fab => {
      const fabProducts = filteredProducts
        .filter(p => p.fabricantId === fab.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')); // Tri alphabétique des produits
      if (fabProducts.length > 0) {
        grouped.push({ fabricant: fab, products: fabProducts });
      }
    });
    
    return grouped;
  }, [filteredProducts, fabricants]);

  const toggleFabricant = (fabricantId: string) => {
    setExpandedFabricants(prev => {
      const next = new Set(prev);
      if (next.has(fabricantId)) {
        next.delete(fabricantId);
      } else {
        next.add(fabricantId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (fabricants) {
      setExpandedFabricants(new Set(fabricants.map(f => f.id)));
    }
  };

  const collapseAll = () => {
    setExpandedFabricants(new Set());
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Inventaire des produits</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFabricantDialogOpen(true)}
              data-testid="button-manage-fabricants"
            >
              <Factory className="h-4 w-4 mr-2" />
              Fabricants
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setProductDialogOpen(true);
              }}
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrer:</span>
            </div>
            <Select value={filterFabricant} onValueChange={setFilterFabricant}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-fabricant">
                <SelectValue placeholder="Fabricant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fabricants</SelectItem>
                {fabricants?.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(fab => (
                  <SelectItem key={fab.id} value={fab.id}>{fab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : groupedProducts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
                  Tout déplier
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
                  Tout replier
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {filteredProducts?.length || 0} produits au total
                </span>
              </div>
              
              {groupedProducts.map(({ fabricant, products: fabProducts }) => (
                <Collapsible
                  key={fabricant.id}
                  open={expandedFabricants.has(fabricant.id)}
                  onOpenChange={() => toggleFabricant(fabricant.id)}
                >
                  <div className="rounded-md border" data-testid={`fabricant-group-${fabricant.id}`}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover-elevate bg-muted/50">
                        <div className="flex items-center gap-3">
                          {expandedFabricants.has(fabricant.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-semibold text-lg" data-testid={`text-fabricant-name-${fabricant.id}`}>
                            {fabricant.name}
                          </span>
                          <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            {fabProducts.length} produit{fabProducts.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Total: {fabProducts.reduce((sum, p) => sum + p.quantity, 0)} unités
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow className="bg-muted/20">
                            <TableHead className="font-semibold py-2">Nom</TableHead>
                            <TableHead className="font-semibold py-2 text-center w-20">Stock</TableHead>
                            <TableHead className="font-semibold py-2 text-center w-36">
                              <div className="flex items-center justify-center gap-1">
                                <Wrench className="h-3.5 w-3.5" />
                                Maintenance
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold py-2 text-center w-24">Dispo</TableHead>
                            <TableHead className="font-semibold py-2 text-right w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fabProducts.map((product) => {
                            const maintenance = product.maintenance || 0;
                            const available = product.quantity - maintenance;
                            return (
                              <TableRow key={product.id} className="hover:bg-muted/20" data-testid={`row-product-${product.id}`}>
                                <TableCell className={`font-medium py-2 ${getProductNameClass(product.name)}`} data-testid={`text-product-name-${product.id}`}>
                                  {product.name}
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  <span className="font-bold" data-testid={`text-quantity-${product.id}`}>
                                    {product.quantity}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => maintenanceMutation.mutate({ id: product.id, delta: -1 })}
                                      disabled={maintenance <= 0 || maintenanceMutation.isPending}
                                      data-testid={`button-maintenance-minus-${product.id}`}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span 
                                      className={`font-bold min-w-[2rem] text-center ${maintenance > 0 ? 'text-orange-500' : ''}`}
                                      data-testid={`text-maintenance-${product.id}`}
                                    >
                                      {maintenance}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => maintenanceMutation.mutate({ id: product.id, delta: 1 })}
                                      disabled={maintenance >= product.quantity || maintenanceMutation.isPending}
                                      data-testid={`button-maintenance-plus-${product.id}`}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  <span 
                                    className={`font-bold ${available <= 0 ? 'text-destructive' : available < product.quantity ? 'text-yellow-500' : 'text-green-500'}`}
                                    data-testid={`text-available-${product.id}`}
                                  >
                                    {available}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <div className="flex items-center justify-end gap-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEditProduct(product)}
                                      data-testid={`button-edit-product-${product.id}`}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDeleteProduct(product)}
                                      data-testid={`button-delete-product-${product.id}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun produit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez par ajouter des produits à votre inventaire.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingProduct(null);
                  setProductDialogOpen(true);
                }}
                data-testid="button-add-first-product"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        fabricants={fabricants || []}
      />

      <FabricantDialog
        open={fabricantDialogOpen}
        onOpenChange={setFabricantDialogOpen}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer le produit"
        description={`Êtes-vous sûr de vouloir supprimer "${productToDelete?.name}" ? Cette action est irréversible.`}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
