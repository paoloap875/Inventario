import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Package, Settings2, CheckCircle, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OrderWithItems, Product, ClientWithContacts } from "@shared/schema";

const orderFormSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems | null;
  products: Product[];
}

export default function OrderDialog({
  open,
  onOpenChange,
  order,
  products,
}: OrderDialogProps) {
  const { toast } = useToast();
  const isEditing = !!order;
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderOptions, setOrderOptions] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedOptionProduct, setSelectedOptionProduct] = useState("");
  const [selectedOptionQuantity, setSelectedOptionQuantity] = useState(1);

  const { data: clients } = useQuery<ClientWithContacts[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      clientName: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        clientName: order.clientName,
        startDate: order.startDate,
        endDate: order.endDate,
      });
      setOrderItems(
        order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      );
      setOrderOptions(
        (order.options || []).map(opt => ({
          productId: opt.productId,
          quantity: opt.quantity,
        }))
      );
    } else {
      form.reset({
        clientName: "",
        startDate: "",
        endDate: "",
      });
      setOrderItems([]);
      setOrderOptions([]);
    }
    setSelectedProduct("");
    setSelectedQuantity(1);
    setSelectedOptionProduct("");
    setSelectedOptionQuantity(1);
  }, [order, form]);

  const createMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      await apiRequest("POST", "/api/orders", {
        ...data,
        items: orderItems,
        options: orderOptions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande créée", description: "La commande a été ajoutée avec succès." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la commande.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      await apiRequest("PATCH", `/api/orders/${order!.id}`, {
        ...data,
        items: orderItems,
        options: orderOptions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande modifiée", description: "La commande a été mise à jour avec succès." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier la commande.", variant: "destructive" });
    },
  });

  const onSubmit = (data: OrderFormValues) => {
    if (orderItems.length === 0 && orderOptions.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un produit ou une option à la commande.", variant: "destructive" });
      return;
    }
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleValidateOption = (productId: string) => {
    const option = orderOptions.find(opt => opt.productId === productId);
    if (!option) return;
    
    const existingItemIndex = orderItems.findIndex(item => item.productId === productId);
    if (existingItemIndex >= 0) {
      const updated = [...orderItems];
      updated[existingItemIndex].quantity += option.quantity;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { productId: option.productId, quantity: option.quantity }]);
    }
    
    setOrderOptions(orderOptions.filter(opt => opt.productId !== productId));
  };

  const handleValidateAllOptions = () => {
    orderOptions.forEach(opt => {
      const existingItemIndex = orderItems.findIndex(item => item.productId === opt.productId);
      if (existingItemIndex >= 0) {
        orderItems[existingItemIndex].quantity += opt.quantity;
      } else {
        orderItems.push({ productId: opt.productId, quantity: opt.quantity });
      }
    });
    setOrderItems([...orderItems]);
    setOrderOptions([]);
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const existingIndex = orderItems.findIndex(item => item.productId === selectedProduct);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += selectedQuantity;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { productId: selectedProduct, quantity: selectedQuantity }]);
    }
    setSelectedProduct("");
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems(
      orderItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleAddOption = () => {
    if (!selectedOptionProduct) return;
    
    const existingIndex = orderOptions.findIndex(opt => opt.productId === selectedOptionProduct);
    if (existingIndex >= 0) {
      const updated = [...orderOptions];
      updated[existingIndex].quantity += selectedOptionQuantity;
      setOrderOptions(updated);
    } else {
      setOrderOptions([...orderOptions, { productId: selectedOptionProduct, quantity: selectedOptionQuantity }]);
    }
    setSelectedOptionProduct("");
    setSelectedOptionQuantity(1);
  };

  const handleRemoveOption = (productId: string) => {
    setOrderOptions(orderOptions.filter(opt => opt.productId !== productId));
  };

  const handleUpdateOptionQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderOptions(
      orderOptions.map(opt =>
        opt.productId === productId ? { ...opt, quantity } : opt
      )
    );
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || "Produit inconnu";
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la commande" : "Nouvelle commande"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Client
                  </FormLabel>
                  <FormControl>
                    {clients && clients.length > 0 ? (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(client => (
                            <SelectItem key={client.id} value={client.name}>
                              {client.name}
                              {client.email && <span className="text-muted-foreground ml-2 text-xs">({client.email})</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        placeholder="Ex: Société ABC" 
                        {...field} 
                        data-testid="input-client-name"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                  {(!clients || clients.length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      Ajoutez des clients via le bouton "Clients" pour les sélectionner ici.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const endDate = form.getValues("endDate");
                          if (e.target.value > endDate) {
                            form.setValue("endDate", e.target.value);
                          }
                        }}
                        data-testid="input-order-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        min={form.watch("startDate")}
                        data-testid="input-order-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Produits</FormLabel>
              
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1" data-testid="select-order-product">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (stock: {product.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                  className="w-20"
                  data-testid="input-order-item-quantity"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  data-testid="button-add-order-item"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {orderItems.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {orderItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 rounded-md border bg-muted/50"
                      data-testid={`order-item-${item.productId}`}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getProductName(item.productId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                          data-testid={`input-quantity-${item.productId}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.productId)}
                          data-testid={`button-remove-item-${item.productId}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-3 border rounded-md bg-muted/30">
                  Aucun produit confirmé (vous pouvez ajouter uniquement des options)
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {orderItems.length} produit(s) • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} unité(s) au total
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <FormLabel>Options (produits optionnels)</FormLabel>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedOptionProduct} onValueChange={setSelectedOptionProduct}>
                  <SelectTrigger className="flex-1" data-testid="select-order-option-product">
                    <SelectValue placeholder="Ajouter une option" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (stock: {product.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={selectedOptionQuantity}
                  onChange={(e) => setSelectedOptionQuantity(parseInt(e.target.value) || 1)}
                  className="w-20"
                  data-testid="input-order-option-quantity"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddOption}
                  disabled={!selectedOptionProduct}
                  data-testid="button-add-order-option"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {orderOptions.length > 0 ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {orderOptions.map((opt) => (
                    <div
                      key={opt.productId}
                      className="flex items-center justify-between p-3 rounded-md border border-dashed bg-muted/30 opacity-70"
                      data-testid={`order-option-${opt.productId}`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{getProductName(opt.productId)}</span>
                        <Badge variant="outline" className="text-xs text-muted-foreground">Option</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={opt.quantity}
                          onChange={(e) => handleUpdateOptionQuantity(opt.productId, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-muted-foreground"
                          data-testid={`input-option-quantity-${opt.productId}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleValidateOption(opt.productId)}
                          title="Valider cette option"
                          data-testid={`button-validate-option-${opt.productId}`}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(opt.productId)}
                          data-testid={`button-remove-option-${opt.productId}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Aucune option ajoutée (les options sont des réservations provisoires non confirmées)
                </div>
              )}

              {orderOptions.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {orderOptions.length} option(s) • {orderOptions.reduce((sum, opt) => sum + opt.quantity, 0)} unité(s) optionnelles
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleValidateAllOptions}
                    data-testid="button-validate-all-options"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Tout valider
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-order"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-order"
              >
                {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
