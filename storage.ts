import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type ClientContact, type InsertClientContact,
  type ClientWithContacts,
  type Fabricant, type InsertFabricant,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderOption, type InsertOrderOption,
  type ProductWithFabricant,
  type OrderWithItems,
  type AvailabilityInfo,
  users, clients, clientContacts, fabricants, products, orders, orderItems, orderOptions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lte, gte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getClients(): Promise<ClientWithContacts[]>;
  getClient(id: string): Promise<ClientWithContacts | undefined>;
  createClient(client: InsertClient, contacts?: Omit<InsertClientContact, 'clientId'>[]): Promise<ClientWithContacts>;
  updateClient(id: string, data: Partial<InsertClient>, contacts?: Omit<InsertClientContact, 'clientId'>[]): Promise<ClientWithContacts | undefined>;
  deleteClient(id: string): Promise<void>;
  
  getFabricants(): Promise<Fabricant[]>;
  getFabricant(id: string): Promise<Fabricant | undefined>;
  createFabricant(fabricant: InsertFabricant): Promise<Fabricant>;
  updateFabricant(id: string, data: Partial<InsertFabricant>): Promise<Fabricant | undefined>;
  deleteFabricant(id: string): Promise<void>;
  
  getProducts(): Promise<ProductWithFabricant[]>;
  getProduct(id: string): Promise<ProductWithFabricant | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[], options?: InsertOrderOption[]): Promise<OrderWithItems>;
  updateOrder(id: string, order: Partial<InsertOrder>, items: InsertOrderItem[], options?: InsertOrderOption[]): Promise<OrderWithItems | undefined>;
  deleteOrder(id: string): Promise<void>;
  
  getAvailability(startDate: string, endDate: string, includeOptions?: boolean): Promise<AvailabilityInfo[]>;
  
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getClients(): Promise<ClientWithContacts[]> {
    const allClients = await db.select().from(clients);
    const allContacts = await db.select().from(clientContacts);
    
    return allClients.map(client => ({
      ...client,
      contacts: allContacts.filter(c => c.clientId === client.id),
    }));
  }

  async getClient(id: string): Promise<ClientWithContacts | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;
    
    const contacts = await db.select().from(clientContacts).where(eq(clientContacts.clientId, id));
    return { ...client, contacts };
  }

  async createClient(client: InsertClient, contacts: Omit<InsertClientContact, 'clientId'>[] = []): Promise<ClientWithContacts> {
    const [newClient] = await db.insert(clients).values(client).returning();
    
    const createdContacts: ClientContact[] = [];
    for (const contact of contacts) {
      const [newContact] = await db.insert(clientContacts).values({
        ...contact,
        clientId: newClient.id,
      }).returning();
      createdContacts.push(newContact);
    }
    
    return { ...newClient, contacts: createdContacts };
  }

  async updateClient(id: string, data: Partial<InsertClient>, contacts: Omit<InsertClientContact, 'clientId'>[] = []): Promise<ClientWithContacts | undefined> {
    const existing = await this.getClient(id);
    if (!existing) return undefined;
    
    const [updated] = await db.update(clients)
      .set(data)
      .where(eq(clients.id, id))
      .returning();
    
    await db.delete(clientContacts).where(eq(clientContacts.clientId, id));
    
    const createdContacts: ClientContact[] = [];
    for (const contact of contacts) {
      const [newContact] = await db.insert(clientContacts).values({
        ...contact,
        clientId: id,
      }).returning();
      createdContacts.push(newContact);
    }
    
    return { ...updated, contacts: createdContacts };
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clientContacts).where(eq(clientContacts.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getFabricants(): Promise<Fabricant[]> {
    return await db.select().from(fabricants);
  }

  async getFabricant(id: string): Promise<Fabricant | undefined> {
    const [fab] = await db.select().from(fabricants).where(eq(fabricants.id, id));
    return fab || undefined;
  }

  async createFabricant(fabricant: InsertFabricant): Promise<Fabricant> {
    const [fab] = await db.insert(fabricants).values(fabricant).returning();
    return fab;
  }

  async updateFabricant(id: string, data: Partial<InsertFabricant>): Promise<Fabricant | undefined> {
    const [updated] = await db.update(fabricants)
      .set({ name: data.name })
      .where(eq(fabricants.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFabricant(id: string): Promise<void> {
    await db.delete(products).where(eq(products.fabricantId, id));
    await db.delete(fabricants).where(eq(fabricants.id, id));
  }

  async getProducts(): Promise<ProductWithFabricant[]> {
    const prods = await db.select().from(products);
    const fabs = await this.getFabricants();
    
    return prods.map(p => ({
      ...p,
      fabricant: fabs.find(f => f.id === p.fabricantId),
    }));
  }

  async getProduct(id: string): Promise<ProductWithFabricant | undefined> {
    const [prod] = await db.select().from(products).where(eq(products.id, id));
    if (!prod) return undefined;
    
    const fabricant = prod.fabricantId ? await this.getFabricant(prod.fabricantId) : undefined;
    
    return { ...prod, fabricant };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [prod] = await db.insert(products).values({
      name: product.name,
      fabricantId: product.fabricantId,
      quantity: product.quantity,
      description: product.description || null,
    }).returning();
    return prod;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);
    const allOptions = await db.select().from(orderOptions);
    const allProducts = await this.getProducts();
    
    return allOrders.map(order => ({
      ...order,
      items: allItems
        .filter(item => item.orderId === order.id)
        .map(item => ({
          ...item,
          product: allProducts.find(p => p.id === item.productId),
        })),
      options: allOptions
        .filter(opt => opt.orderId === order.id)
        .map(opt => ({
          ...opt,
          product: allProducts.find(p => p.id === opt.productId),
        })),
    }));
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const opts = await db.select().from(orderOptions).where(eq(orderOptions.orderId, id));
    const allProducts = await this.getProducts();
    
    return {
      ...order,
      items: items.map(item => ({
        ...item,
        product: allProducts.find(p => p.id === item.productId),
      })),
      options: opts.map(opt => ({
        ...opt,
        product: allProducts.find(p => p.id === opt.productId),
      })),
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[], options: InsertOrderOption[] = []): Promise<OrderWithItems> {
    const [newOrder] = await db.insert(orders).values({
      clientName: order.clientName,
      startDate: order.startDate,
      endDate: order.endDate,
    }).returning();
    
    const createdItems: OrderItem[] = [];
    for (const item of items) {
      const [newItem] = await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
      }).returning();
      createdItems.push(newItem);
    }
    
    const createdOptions: OrderOption[] = [];
    for (const opt of options) {
      const [newOpt] = await db.insert(orderOptions).values({
        orderId: newOrder.id,
        productId: opt.productId,
        quantity: opt.quantity,
      }).returning();
      createdOptions.push(newOpt);
    }
    
    const allProducts = await this.getProducts();
    return {
      ...newOrder,
      items: createdItems.map(item => ({
        ...item,
        product: allProducts.find(p => p.id === item.productId),
      })),
      options: createdOptions.map(opt => ({
        ...opt,
        product: allProducts.find(p => p.id === opt.productId),
      })),
    };
  }

  async updateOrder(id: string, order: Partial<InsertOrder>, items: InsertOrderItem[], options: InsertOrderOption[] = []): Promise<OrderWithItems | undefined> {
    const existing = await this.getOrder(id);
    if (!existing) return undefined;
    
    const [updated] = await db.update(orders)
      .set({
        clientName: order.clientName ?? existing.clientName,
        startDate: order.startDate ?? existing.startDate,
        endDate: order.endDate ?? existing.endDate,
      })
      .where(eq(orders.id, id))
      .returning();
    
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orderOptions).where(eq(orderOptions.orderId, id));
    
    const createdItems: OrderItem[] = [];
    for (const item of items) {
      const [newItem] = await db.insert(orderItems).values({
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
      }).returning();
      createdItems.push(newItem);
    }
    
    const createdOptions: OrderOption[] = [];
    for (const opt of options) {
      const [newOpt] = await db.insert(orderOptions).values({
        orderId: id,
        productId: opt.productId,
        quantity: opt.quantity,
      }).returning();
      createdOptions.push(newOpt);
    }
    
    const allProducts = await this.getProducts();
    return {
      ...updated,
      items: createdItems.map(item => ({
        ...item,
        product: allProducts.find(p => p.id === item.productId),
      })),
      options: createdOptions.map(opt => ({
        ...opt,
        product: allProducts.find(p => p.id === opt.productId),
      })),
    };
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orderOptions).where(eq(orderOptions.orderId, id));
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getAvailability(startDate: string, endDate: string, includeOptions: boolean = false): Promise<AvailabilityInfo[]> {
    const allProducts = await this.getProducts();
    const overlappingOrders = await db.select().from(orders).where(
      and(
        lte(orders.startDate, endDate),
        gte(orders.endDate, startDate)
      )
    );
    
    const allItems = await db.select().from(orderItems);
    const allOptions = await db.select().from(orderOptions);
    
    return allProducts.map(product => {
      let rentedQuantity = 0;
      
      overlappingOrders.forEach(order => {
        const item = allItems.find(i => i.orderId === order.id && i.productId === product.id);
        if (item) {
          rentedQuantity += item.quantity;
        }
        
        if (includeOptions) {
          const opt = allOptions.find(o => o.orderId === order.id && o.productId === product.id);
          if (opt) {
            rentedQuantity += opt.quantity;
          }
        }
      });
      
      const maintenanceQuantity = product.maintenance || 0;
      
      return {
        product,
        totalQuantity: product.quantity,
        maintenanceQuantity,
        rentedQuantity,
        availableQuantity: product.quantity - maintenanceQuantity - rentedQuantity,
      };
    });
  }

  async seedInitialData(): Promise<void> {
    const existingFabricants = await this.getFabricants();
    if (existingFabricants.length > 0) return;
    
    const fabSPX = await this.createFabricant({ name: "SPX" });
    const fabFenyx = await this.createFabricant({ name: "Fenyx" });
    const fabBeacon = await this.createFabricant({ name: "Beacon" });
    const fabCadreurs = await this.createFabricant({ name: "Cadreurs" });
    const fabPonctuel = await this.createFabricant({ name: "Ponctuel" });
    const fabOptec = await this.createFabricant({ name: "Optec" });
    const fabLoupi = await this.createFabricant({ name: "Loupi" });
    const fabBesun = await this.createFabricant({ name: "Besun" });
    
    await this.createProduct({ name: "SPX noir 18w 3K", fabricantId: fabSPX.id, quantity: 43 });
    await this.createProduct({ name: "SPX noir 18w 4K", fabricantId: fabSPX.id, quantity: 253 });
    await this.createProduct({ name: "SPX blanc 18w 3K", fabricantId: fabSPX.id, quantity: 54 });
    await this.createProduct({ name: "SPX blanc 18w 4K", fabricantId: fabSPX.id, quantity: 20 });
    await this.createProduct({ name: "SPX noir 35w 3K", fabricantId: fabSPX.id, quantity: 0 });
    await this.createProduct({ name: "SPX noir 35w 4K", fabricantId: fabSPX.id, quantity: 327 });
    await this.createProduct({ name: "SPX blanc 35w 3K", fabricantId: fabSPX.id, quantity: 0 });
    await this.createProduct({ name: "SPX blanc 35w 4K", fabricantId: fabSPX.id, quantity: 6 });
    
    await this.createProduct({ name: "Fenyx noir 3K", fabricantId: fabFenyx.id, quantity: 24 });
    await this.createProduct({ name: "Fenyx noir 4K", fabricantId: fabFenyx.id, quantity: 79 });
    await this.createProduct({ name: "Fenyx blanc 3K", fabricantId: fabFenyx.id, quantity: 148 });
    await this.createProduct({ name: "Fenyx blanc 4K", fabricantId: fabFenyx.id, quantity: 18 });
    await this.createProduct({ name: "Fenyx Gris 3K", fabricantId: fabFenyx.id, quantity: 34 });
    
    await this.createProduct({ name: "Beacon noir II 3k", fabricantId: fabBeacon.id, quantity: 191 });
    await this.createProduct({ name: "Beacon noir II 4k", fabricantId: fabBeacon.id, quantity: 250 });
    await this.createProduct({ name: "Beacon blanc II 3k", fabricantId: fabBeacon.id, quantity: 50 });
    await this.createProduct({ name: "Beacon blanc II 4k", fabricantId: fabBeacon.id, quantity: 78 });
    await this.createProduct({ name: "Beacon XL noir 3K", fabricantId: fabBeacon.id, quantity: 44 });
    await this.createProduct({ name: "Beacon XL noir 4K", fabricantId: fabBeacon.id, quantity: 188 });
    await this.createProduct({ name: "Beacon XL blanc 3K", fabricantId: fabBeacon.id, quantity: 75 });
    await this.createProduct({ name: "Beacon XL blanc 4K", fabricantId: fabBeacon.id, quantity: 46 });
    
    await this.createProduct({ name: "Cadreurs halogene noir", fabricantId: fabCadreurs.id, quantity: 0 });
    await this.createProduct({ name: "Cadreurs halogene blanc", fabricantId: fabCadreurs.id, quantity: 0 });
    
    await this.createProduct({ name: "Ponctuel noir", fabricantId: fabPonctuel.id, quantity: 0 });
    await this.createProduct({ name: "Ponctuel blanc", fabricantId: fabPonctuel.id, quantity: 0 });
    
    await this.createProduct({ name: "Optec noir 3k", fabricantId: fabOptec.id, quantity: 0 });
    await this.createProduct({ name: "Optec noir 4k", fabricantId: fabOptec.id, quantity: 0 });
    await this.createProduct({ name: "Optec blanc 3k", fabricantId: fabOptec.id, quantity: 0 });
    await this.createProduct({ name: "Optec blanc 4k", fabricantId: fabOptec.id, quantity: 0 });
    
    await this.createProduct({ name: "Loupi Micro C noir 16° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C noir 10° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C noir 18° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C noir 28° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C noir 40° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C blanc 10° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    await this.createProduct({ name: "Loupi spot C blanc 18° 3K", fabricantId: fabLoupi.id, quantity: 0 });
    
    await this.createProduct({ name: "Besun 24W noir 3K", fabricantId: fabBesun.id, quantity: 0 });
    await this.createProduct({ name: "Besun 24W blanc 3K", fabricantId: fabBesun.id, quantity: 0 });
  }
}

export const storage = new DatabaseStorage();
