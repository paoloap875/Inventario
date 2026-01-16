import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Search, Package, Settings2, ChevronDown, ChevronRight, Factory, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvailabilityInfo, Fabricant } from "@shared/schema";
import { getProductNameClass } from "@/lib/productUtils";

export default function AvailabilityTab() {
  const today = format(new Date(), "yyyy-MM-dd");
  const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem("availability_startDate");
    return saved || today;
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem("availability_endDate");
    return saved || nextWeek;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [includeOptions, setIncludeOptions] = useState(() => {
    const saved = localStorage.getItem("availability_includeOptions");
    return saved === "true";
  });
  const [expandedFabricants, setExpandedFabricants] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem("availability_startDate", startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem("availability_endDate", endDate);
  }, [endDate]);

  useEffect(() => {
    localStorage.setItem("availability_includeOptions", String(includeOptions));
  }, [includeOptions]);

  const { data: fabricants } = useQuery<Fabricant[]>({
    queryKey: ["/api/fabricants"],
  });

  const { data: availability, isLoading, isFetching } = useQuery<AvailabilityInfo[]>({
    queryKey: ["/api/availability", startDate, endDate, includeOptions],
    queryFn: async () => {
      const response = await fetch(`/api/availability/${startDate}/${endDate}?includeOptions=${includeOptions}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return response.json();
    },
    enabled: !!startDate && !!endDate,
  });

  const filteredAvailability = useMemo(() => {
    if (!availability) return [];
    
    return availability
      .filter(item => {
        if (searchTerm && !item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'fr'));
  }, [availability, searchTerm]);

  const groupedAvailability = useMemo(() => {
    if (!filteredAvailability || !fabricants) return [];
    
    const grouped: { fabricant: Fabricant; items: AvailabilityInfo[] }[] = [];
    
    const sortedFabricants = [...fabricants].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    
    sortedFabricants.forEach(fab => {
      const fabItems = filteredAvailability
        .filter(item => item.product.fabricantId === fab.id)
        .sort((a, b) => a.product.name.localeCompare(b.product.name, 'fr'));
      if (fabItems.length > 0) {
        grouped.push({ fabricant: fab, items: fabItems });
      }
    });
    
    return grouped;
  }, [filteredAvailability, fabricants]);

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

  const getAvailabilityBadge = (available: number, total: number) => {
    if (available === 0) {
      return { label: "Épuisé", variant: "destructive" as const };
    }
    if (available <= total * 0.2) {
      return { label: "Faible", variant: "secondary" as const };
    }
    return { label: "Disponible", variant: "default" as const };
  };

  const getFabricantStats = (items: AvailabilityInfo[]) => {
    const totalStock = items.reduce((sum, i) => sum + i.totalQuantity, 0);
    const totalMaintenance = items.reduce((sum, i) => sum + i.maintenanceQuantity, 0);
    const totalRented = items.reduce((sum, i) => sum + i.rentedQuantity, 0);
    const totalAvailable = items.reduce((sum, i) => sum + i.availableQuantity, 0);
    return { totalStock, totalMaintenance, totalRented, totalAvailable };
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Vérifier la disponibilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (newStart > endDate) {
                    setEndDate(newStart);
                  }
                }}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const todayDate = format(new Date(), "yyyy-MM-dd");
                setStartDate(todayDate);
                setEndDate(todayDate);
              }}
              className="self-end"
              data-testid="button-today"
            >
              Aujourd'hui
            </Button>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom du produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-availability"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="include-options" className="text-sm whitespace-nowrap">
                Inclure options
              </Label>
              <Switch
                id="include-options"
                checked={includeOptions}
                onCheckedChange={setIncludeOptions}
                data-testid="switch-include-options"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/10 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          {isLoading || isFetching ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : groupedAvailability.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
                  Tout déplier
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
                  Tout replier
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {filteredAvailability?.length || 0} produits au total
                </span>
              </div>
              
              {groupedAvailability.map(({ fabricant, items }) => {
                const stats = getFabricantStats(items);
                return (
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
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-lg" data-testid={`text-fabricant-name-${fabricant.id}`}>
                              {fabricant.name}
                            </span>
                            <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                              {items.length} produit{items.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Stock: <span className="font-medium text-foreground">{stats.totalStock}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Maint: <span className="font-medium text-orange-500">{stats.totalMaintenance}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Loués: <span className="font-medium text-orange-400">{stats.totalRented}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Dispo: <span className={`font-bold ${stats.totalAvailable === 0 ? "text-red-500" : "text-green-500"}`}>{stats.totalAvailable}</span>
                            </span>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table className="text-sm">
                          <TableHeader>
                            <TableRow className="bg-muted/20">
                              <TableHead className="font-semibold py-2">Produit</TableHead>
                              <TableHead className="font-semibold py-2 text-center w-16">Stock</TableHead>
                              <TableHead className="font-semibold py-2 text-center w-20">
                                <div className="flex items-center justify-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  Maint.
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold py-2 text-center w-16">Loués</TableHead>
                              <TableHead className="font-semibold py-2 text-center w-20">Dispo</TableHead>
                              <TableHead className="font-semibold py-2 text-center w-24">Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => {
                              const badge = getAvailabilityBadge(item.availableQuantity, item.totalQuantity);
                              
                              return (
                                <TableRow key={item.product.id} className="hover:bg-muted/20" data-testid={`row-availability-${item.product.id}`}>
                                  <TableCell className={`font-medium py-2 ${getProductNameClass(item.product.name)}`} data-testid={`text-product-name-${item.product.id}`}>
                                    {item.product.name}
                                  </TableCell>
                                  <TableCell className="text-center py-2 font-medium">
                                    {item.totalQuantity}
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <span className={item.maintenanceQuantity > 0 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                                      {item.maintenanceQuantity}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <span className={item.rentedQuantity > 0 ? "text-orange-400 font-medium" : "text-muted-foreground"}>
                                      {item.rentedQuantity}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <span className={`font-bold ${
                                      item.availableQuantity === 0 
                                        ? "text-red-600 dark:text-red-400" 
                                        : item.availableQuantity <= item.totalQuantity * 0.3 
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-green-600 dark:text-green-400"
                                    }`} data-testid={`text-available-${item.product.id}`}>
                                      {item.availableQuantity}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Badge variant={badge.variant} className="text-xs px-2 py-0" data-testid={`badge-availability-${item.product.id}`}>
                                      {badge.label}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {availability?.length === 0 
                  ? "Ajoutez des produits à votre inventaire pour voir leur disponibilité."
                  : "Aucun produit ne correspond à votre recherche."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
