import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductWithFabricant, Fabricant } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  fabricantId: z.string().min(1, "Le fabricant est requis"),
  quantity: z.coerce.number().min(0, "La quantité doit être positive"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithFabricant | null;
  fabricants: Fabricant[];
}

export default function ProductDialog({
  open,
  onOpenChange,
  product,
  fabricants,
}: ProductDialogProps) {
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      fabricantId: "",
      quantity: 1,
      description: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        fabricantId: product.fabricantId,
        quantity: product.quantity,
        description: product.description || "",
      });
    } else {
      form.reset({
        name: "",
        fabricantId: "",
        quantity: 1,
        description: "",
      });
    }
  }, [product, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        ...data,
        description: data.description || null,
      };
      await apiRequest("POST", "/api/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit créé", description: "Le produit a été ajouté avec succès." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le produit.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        ...data,
        description: data.description || null,
      };
      await apiRequest("PATCH", `/api/products/${product!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit modifié", description: "Le produit a été mis à jour avec succès." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le produit.", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le produit" : "Ajouter un produit"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: SPX noir 18w 3K" 
                      {...field} 
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fabricantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fabricant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-product-fabricant">
                        <SelectValue placeholder="Sélectionner un fabricant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fabricants.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(fab => (
                        <SelectItem key={fab.id} value={fab.id}>
                          {fab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité totale</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      {...field} 
                      data-testid="input-product-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description du produit..." 
                      className="resize-none"
                      {...field} 
                      data-testid="input-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-product"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-product"
              >
                {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
