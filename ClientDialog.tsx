import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import type { ClientWithContacts } from "@shared/schema";

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClientDialog({ open, onOpenChange }: ClientDialogProps) {
  const { toast } = useToast();
  const [editingClient, setEditingClient] = useState<ClientWithContacts | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  const { data: clients, isLoading } = useQuery<ClientWithContacts[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/clients", {
        name: clientName,
        contacts: contacts.filter(c => c.name.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client ajouté", description: "Le client a été créé avec succès." });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le client.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/clients/${editingClient!.id}`, {
        name: clientName,
        contacts: contacts.filter(c => c.name.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client modifié", description: "Le client a été mis à jour." });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le client.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client supprimé", description: "Le client a été supprimé." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le client.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setClientName("");
    setContacts([]);
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: ClientWithContacts) => {
    setEditingClient(client);
    setClientName(client.name);
    setContacts(client.contacts.map(c => ({
      name: c.name,
      role: c.role || "",
      email: c.email || "",
      phone: c.phone || "",
    })));
    setShowForm(true);
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: "", role: "", email: "", phone: "" }]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast({ title: "Erreur", description: "Le nom du client est requis.", variant: "destructive" });
      return;
    }
    if (editingClient) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des clients
          </DialogTitle>
          <DialogDescription>
            Ajoutez et gérez vos clients avec leurs contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="w-full"
              data-testid="button-add-client"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nom du client *</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nom de l'entreprise ou du client"
                  data-testid="input-client-name"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Contacts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddContact}
                    data-testid="button-add-contact"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Ajouter un contact
                  </Button>
                </div>

                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                    Aucun contact. Cliquez sur "Ajouter un contact" pour en créer.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact, index) => (
                      <div key={index} className="p-3 border rounded-md space-y-2 bg-background">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Contact {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveContact(index)}
                            data-testid={`button-remove-contact-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Nom *</Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => handleContactChange(index, "name", e.target.value)}
                              placeholder="Nom du contact"
                              data-testid={`input-contact-name-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rôle</Label>
                            <Input
                              value={contact.role}
                              onChange={(e) => handleContactChange(index, "role", e.target.value)}
                              placeholder="Ex: Directeur, Technicien..."
                              data-testid={`input-contact-role-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, "email", e.target.value)}
                              placeholder="email@exemple.com"
                              data-testid={`input-contact-email-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Téléphone</Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                              placeholder="06 00 00 00 00"
                              data-testid={`input-contact-phone-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel-client">
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting} data-testid="button-save-client">
                  {isSubmitting ? "Enregistrement..." : editingClient ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : clients && clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map((client) => (
                  <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.contacts.length > 0 ? (
                          client.contacts.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {c.name}
                              {c.role && <span className="ml-1 text-muted-foreground">({c.role})</span>}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Aucun contact</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                          data-testid={`button-edit-client-${client.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(client.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-client-${client.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun client enregistré</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
