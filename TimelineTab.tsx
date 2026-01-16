import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, BarChart3, Settings2, ChevronDown, ChevronUp, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { OrderWithItems, ProductWithFabricant } from "@shared/schema";
import { getProductNameClass } from "@/lib/productUtils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO, 
  isWithinInterval,
  addMonths,
  subMonths
} from "date-fns";
import { fr } from "date-fns/locale";

export default function TimelineTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [includeOptions, setIncludeOptions] = useState(false);
  const [expandedFabricants, setExpandedFabricants] = useState<Set<string>>(new Set());

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithFabricant[]>({
    queryKey: ["/api/products"],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const productTimelines = useMemo(() => {
    if (!products || !orders) return [];

    return products.map(product => {
      const maintenanceQty = product.maintenance || 0;
      const dailyAvailability = daysInMonth.map(day => {
        let rentedQuantity = 0;
        
        orders.forEach(order => {
          const start = parseISO(order.startDate);
          const end = parseISO(order.endDate);
          
          if (isWithinInterval(day, { start, end })) {
            const item = order.items.find(i => i.productId === product.id);
            if (item) {
              rentedQuantity += item.quantity;
            }
            
            if (includeOptions && order.options) {
              const option = order.options.find(o => o.productId === product.id);
              if (option) {
                rentedQuantity += option.quantity;
              }
            }
          }
        });
        
        return {
          date: day,
          total: product.quantity,
          maintenance: maintenanceQty,
          rented: rentedQuantity,
          available: product.quantity - maintenanceQty - rentedQuantity,
        };
      });

      return {
        product,
        dailyAvailability,
      };
    });
  }, [products, orders, daysInMonth, includeOptions]);

  const groupedByFabricant = useMemo(() => {
    const groups: Map<string, { fabricantName: string; items: typeof productTimelines }> = new Map();
    
    productTimelines.forEach(timeline => {
      const fabricantId = timeline.product.fabricantId;
      const fabricantName = timeline.product.fabricant?.name || "Sans fabricant";
      
      if (!groups.has(fabricantId)) {
        groups.set(fabricantId, { fabricantName, items: [] });
      }
      groups.get(fabricantId)!.items.push(timeline);
    });
    
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => a.fabricantName.localeCompare(b.fabricantName))
      .map(([id, data]) => ({ 
        id, 
        fabricantName: data.fabricantName,
        items: data.items.sort((a, b) => a.product.name.localeCompare(b.product.name))
      }));
  }, [productTimelines]);

  const toggleFabricant = (id: string) => {
    setExpandedFabricants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const isLoading = ordersLoading || productsLoading;

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4 flex-wrap">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Timeline des locations</CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="timeline-include-options" className="text-sm whitespace-nowrap">
                Inclure options
              </Label>
              <Switch
                id="timeline-include-options"
                checked={includeOptions}
                onCheckedChange={setIncludeOptions}
                data-testid="switch-timeline-include-options"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[150px] text-center font-medium" data-testid="text-current-month">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Légende:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" />
              <span className="text-sm">Stock bas (&lt;20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
              <span className="text-sm">Rupture</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : groupedByFabricant.length > 0 ? (
            <div className="overflow-auto relative max-h-[60vh]">
              <div className="min-w-[1200px]">
                <div className="flex border-b pb-3 mb-3 sticky top-0 bg-card z-20">
                  <div className="w-44 shrink-0 font-semibold text-sm text-muted-foreground sticky left-0 bg-card z-30 pr-2">
                    Produit
                  </div>
                  <div className="flex-1 flex gap-0.5">
                    {daysInMonth.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 min-w-[32px] text-center text-xs py-1 ${
                          day.getDay() === 0 || day.getDay() === 6
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        <div className="font-semibold text-sm">{format(day, "d")}</div>
                        <div className="text-muted-foreground text-[10px]">{format(day, "EEE", { locale: fr })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {groupedByFabricant.map(({ id, fabricantName, items }) => {
                    const isExpanded = expandedFabricants.has(id);
                    
                    return (
                      <Collapsible key={id} open={isExpanded} onOpenChange={() => toggleFabricant(id)}>
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors sticky left-0"
                            data-testid={`timeline-fabricant-${id}`}
                          >
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Factory className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold text-sm">{fabricantName}</span>
                            <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                              {items.length} produit{items.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-1 mt-2">
                            {items.map(({ product, dailyAvailability }) => (
                              <div
                                key={product.id}
                                className="flex items-center min-h-[48px] hover:bg-muted/30 rounded-lg transition-colors"
                                data-testid={`timeline-row-${product.id}`}
                              >
                                <div className="w-44 shrink-0 pr-2 sticky left-0 bg-card z-10">
                                  <div className={`font-medium text-sm truncate ${getProductNameClass(product.name)}`} title={product.name}>
                                    {product.name}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    Stock: {product.quantity}
                                    {product.maintenance > 0 && (
                                      <span className="text-orange-500 ml-2">Maint: {product.maintenance}</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex-1 flex gap-0.5">
                                  {dailyAvailability.map((dayInfo, idx) => {
                                    const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
                                    const hasRentals = dayInfo.rented > 0;
                                    const isLowStock = dayInfo.available > 0 && dayInfo.available <= Math.ceil(dayInfo.total * 0.2);
                                    const isOutOfStock = dayInfo.available <= 0;
                                    
                                    let bgColor = "bg-green-100 dark:bg-green-900/30";
                                    let textColor = "text-green-700 dark:text-green-400";
                                    
                                    if (isOutOfStock) {
                                      bgColor = "bg-red-100 dark:bg-red-900/30";
                                      textColor = "text-red-700 dark:text-red-400";
                                    } else if (isLowStock) {
                                      bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
                                      textColor = "text-yellow-700 dark:text-yellow-400";
                                    } else if (!hasRentals && dayInfo.maintenance === 0) {
                                      bgColor = "";
                                      textColor = "text-muted-foreground";
                                    }

                                    return (
                                      <Tooltip key={idx}>
                                        <TooltipTrigger asChild>
                                          <div
                                            className={`flex-1 min-w-[32px] h-10 flex items-center justify-center rounded text-sm font-semibold cursor-default ${bgColor} ${textColor} ${isWeekend ? "opacity-60" : ""}`}
                                            data-testid={`availability-${product.id}-${format(dayInfo.date, "yyyy-MM-dd")}`}
                                          >
                                            {dayInfo.available}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-sm">
                                            <div className="font-semibold">{product.name}</div>
                                            <div className="text-muted-foreground">
                                              {format(dayInfo.date, "EEEE d MMMM", { locale: fr })}
                                            </div>
                                            <div className="mt-2 space-y-1">
                                              <div>Stock total: {dayInfo.total}</div>
                                              {dayInfo.maintenance > 0 && (
                                                <div className="text-orange-500">Maintenance: {dayInfo.maintenance}</div>
                                              )}
                                              <div>Loués: {dayInfo.rented}</div>
                                              <div className={`font-semibold ${isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-500" : "text-green-500"}`}>
                                                Disponibles: {dayInfo.available}
                                              </div>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun produit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez des produits pour voir leur disponibilité sur le calendrier.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
