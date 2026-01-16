import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertFabricantSchema, insertProductSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const createClientSchema = insertClientSchema.extend({
  contacts: z.array(contactSchema).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await storage.seedInitialData();
  
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = createClientSchema.parse(req.body);
      const { contacts, ...clientData } = data;
      const client = await storage.createClient(clientData, contacts || []);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const data = createClientSchema.partial().parse(req.body);
      const { contacts, ...clientData } = data;
      const client = await storage.updateClient(req.params.id, clientData, contacts);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });
  
  app.get("/api/fabricants", async (req, res) => {
    try {
      const fabricants = await storage.getFabricants();
      res.json(fabricants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabricants" });
    }
  });

  app.post("/api/fabricants", async (req, res) => {
    try {
      const data = insertFabricantSchema.parse(req.body);
      const fabricant = await storage.createFabricant(data);
      res.status(201).json(fabricant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create fabricant" });
      }
    }
  });

  app.patch("/api/fabricants/:id", async (req, res) => {
    try {
      const fabricant = await storage.updateFabricant(req.params.id, req.body);
      if (!fabricant) {
        return res.status(404).json({ error: "Fabricant not found" });
      }
      res.json(fabricant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update fabricant" });
    }
  });

  app.delete("/api/fabricants/:id", async (req, res) => {
    try {
      await storage.deleteFabricant(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete fabricant" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.patch("/api/products/:id/maintenance", async (req, res) => {
    try {
      const { delta } = req.body;
      if (typeof delta !== "number") {
        return res.status(400).json({ error: "Delta must be a number" });
      }
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const currentMaintenance = product.maintenance || 0;
      const newMaintenance = Math.max(0, Math.min(product.quantity, currentMaintenance + delta));
      const updated = await storage.updateProduct(req.params.id, { maintenance: newMaintenance });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update maintenance" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  const orderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  });

  const createOrderSchema = insertOrderSchema.extend({
    items: z.array(orderItemSchema),
    options: z.array(orderItemSchema).optional(),
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const data = createOrderSchema.parse(req.body);
      const { items, options, ...orderData } = data;
      const order = await storage.createOrder(
        orderData, 
        items.map(item => ({ ...item, orderId: "" })),
        (options || []).map(opt => ({ ...opt, orderId: "" }))
      );
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const data = createOrderSchema.partial().parse(req.body);
      const { items, options, ...orderData } = data;
      const order = await storage.updateOrder(
        req.params.id, 
        orderData, 
        items?.map(item => ({ ...item, orderId: req.params.id })) || [],
        (options || []).map(opt => ({ ...opt, orderId: req.params.id }))
      );
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.get("/api/availability/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const includeOptions = req.query.includeOptions === "true";
      const availability = await storage.getAvailability(startDate, endDate, includeOptions);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  return httpServer;
}
