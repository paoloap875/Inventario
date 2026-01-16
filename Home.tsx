import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, Calendar, BarChart3, ArrowUpDown } from "lucide-react";
import InventoryTab from "@/components/InventoryTab";
import StockAdjustmentTab from "@/components/StockAdjustmentTab";
import OrdersTab from "@/components/OrdersTab";
import AvailabilityTab from "@/components/AvailabilityTab";
import TimelineTab from "@/components/TimelineTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        {/* Diagonal lines */}
        <div className="absolute top-20 right-10 w-px h-64 bg-gradient-to-b from-transparent via-primary/30 to-transparent rotate-45" />
        <div className="absolute top-40 right-32 w-px h-48 bg-gradient-to-b from-transparent via-secondary/40 to-transparent rotate-45" />
        <div className="absolute bottom-20 left-10 w-px h-64 bg-gradient-to-b from-transparent via-accent/30 to-transparent -rotate-45" />
        <div className="absolute bottom-40 left-32 w-px h-48 bg-gradient-to-b from-transparent via-primary/25 to-transparent -rotate-45" />
      </div>
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-app-title">
              Inventario
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="glass rounded-2xl p-2 mb-8 inline-flex w-full" data-testid="nav-tabs">
            <TabsList className="grid w-full grid-cols-5 bg-transparent gap-2">
              <TabsTrigger 
                value="inventory" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:glow-primary transition-all duration-200"
                data-testid="tab-inventory"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Inventaire</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stock-adjustment" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:glow-accent transition-all duration-200"
                data-testid="tab-stock-adjustment"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Ajustements</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-lg data-[state=active]:glow-secondary transition-all duration-200"
                data-testid="tab-orders"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Commandes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:glow-accent transition-all duration-200"
                data-testid="tab-availability"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Disponibilité</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:glow-primary transition-all duration-200"
                data-testid="tab-timeline"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-semibold">Timeline</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="mt-0">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="stock-adjustment" className="mt-0">
            <StockAdjustmentTab />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <AvailabilityTab />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <TimelineTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
