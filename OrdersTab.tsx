import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ShoppingCart, Calendar, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OrderWithItems, Product } from "@shared/schema";
import OrderDialog from "./OrderDialog";
import ClientDialog from "./ClientDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { getProductBadgeClass } from "@/lib/productUtils";

export default function OrdersTab() {
  const { toast } = useToast();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithItems | null>(null);

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande supprimée", description: "La commande a été supprimée avec succès." });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer la commande.", variant: "destructive" });
    },
  });

  const handleEditOrder = (order: OrderWithItems) => {
    setEditingOrder(order);
    setOrderDialogOpen(true);
  };

  const handleDeleteOrder = (order: OrderWithItems) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getOrderStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (now < start) {
      return { label: "À venir", variant: "secondary" as const };
    } else if (now > end) {
      return { label: "Terminée", variant: "outline" as const };
    } else {
      return { label: "En cours", variant: "default" as const };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Gestion des commandes</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClientDialogOpen(true)}
              data-testid="button-manage-clients"
            >
              <Users className="h-4 w-4 mr-2" />
              Clients
            </Button>
            <Button
              onClick={() => {
                setEditingOrder(null);
                setOrderDialogOpen(true);
              }}
              data-testid="button-add-order"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date de début</TableHead>
                    <TableHead className="font-semibold">Date de fin</TableHead>
                    <TableHead className="font-semibold">Produits</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const status = getOrderStatus(order.startDate, order.endDate);
                    return (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-medium" data-testid={`text-client-name-${order.id}`}>
                          {order.clientName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-start-date-${order.id}`}>
                              {formatDate(order.startDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-end-date-${order.id}`}>
                              {formatDate(order.endDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {order.items.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className={`text-xs ${getProductBadgeClass(item.product?.name || "")}`}>
                                {item.product?.name || "Produit"} x{item.quantity}
                              </Badge>
                            ))}
                            {order.options && order.options.map((opt, idx) => (
                              <Badge key={`opt-${idx}`} variant="outline" className="text-xs text-muted-foreground opacity-60">
                                {opt.product?.name || "Option"} x{opt.quantity}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} data-testid={`badge-status-${order.id}`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOrder(order)}
                              data-testid={`button-edit-order-${order.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOrder(order)}
                              data-testid={`button-delete-order-${order.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucune commande</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Créez votre première commande de location.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingOrder(null);
                  setOrderDialogOpen(true);
                }}
                data-testid="button-add-first-order"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle commande
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        order={editingOrder}
        products={products || []}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer la commande"
        description={`Êtes-vous sûr de vouloir supprimer la commande de "${orderToDelete?.clientName}" ? Cette action est irréversible.`}
        isLoading={deleteOrderMutation.isPending}
      />

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
      />
    </div>
  );
}
