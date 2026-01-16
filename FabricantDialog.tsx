import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Factory, Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Fabricant } from "@shared/schema";

interface FabricantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FabricantDialog({ open, onOpenChange }: FabricantDialogProps) {
  const { toast } = useToast();
  const [newFabricantName, setNewFabricantName] = useState("");
  const [editingFabricantId, setEditingFabricantId] = useState<string | null>(null);
  const [editingFabricantName, setEditingFabricantName] = useState("");

  const { data: fabricants, isLoading } = useQuery<Fabricant[]>({
    queryKey: ["/api/fabricants"],
  });

  const createFabricantMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/fabricants", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabricants"] });
      toast({ title: "Fabricant créé", description: "Le fabricant a été ajouté avec succès." });
      setNewFabricantName("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le fabricant.", variant: "destructive" });
    },
  });

  const deleteFabricantMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fabricants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabricants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Fabricant supprimé", description: "Le fabricant et ses produits ont été supprimés." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le fabricant.", variant: "destructive" });
    },
  });

  const updateFabricantMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/fabricants/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fabricants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Fabricant modifié", description: "Le nom a été mis à jour." });
      setEditingFabricantId(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le fabricant.", variant: "destructive" });
    },
  });

  const handleAddFabricant = () => {
    if (newFabricantName.trim()) {
      createFabricantMutation.mutate(newFabricantName.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Gestion des fabricants
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nom du nouveau fabricant"
              value={newFabricantName}
              onChange={(e) => setNewFabricantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFabricant()}
              data-testid="input-new-fabricant"
            />
            <Button
              onClick={handleAddFabricant}
              disabled={!newFabricantName.trim() || createFabricantMutation.isPending}
              data-testid="button-add-fabricant"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : fabricants && fabricants.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {fabricants.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(fabricant => {
                const isEditing = editingFabricantId === fabricant.id;
                return (
                  <div
                    key={fabricant.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                    data-testid={`fabricant-item-${fabricant.id}`}
                  >
                    {isEditing ? (
                      <Input
                        value={editingFabricantName}
                        onChange={(e) => setEditingFabricantName(e.target.value)}
                        className="h-7 flex-1 mr-2"
                        autoFocus
                        data-testid={`input-edit-fabricant-${fabricant.id}`}
                      />
                    ) : (
                      <span className="font-medium">{fabricant.name}</span>
                    )}
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (editingFabricantName.trim()) {
                                updateFabricantMutation.mutate({ id: fabricant.id, name: editingFabricantName.trim() });
                              }
                            }}
                            disabled={updateFabricantMutation.isPending}
                            data-testid={`button-save-fabricant-${fabricant.id}`}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingFabricantId(null)}
                            data-testid={`button-cancel-edit-fabricant-${fabricant.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingFabricantId(fabricant.id);
                              setEditingFabricantName(fabricant.name);
                            }}
                            data-testid={`button-edit-fabricant-${fabricant.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFabricantMutation.mutate(fabricant.id)}
                            disabled={deleteFabricantMutation.isPending}
                            data-testid={`button-delete-fabricant-${fabricant.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun fabricant. Créez-en un pour commencer.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
