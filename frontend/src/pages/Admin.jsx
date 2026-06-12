import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";

export default function Admin() {
  return (
    <div className="p-8">
      <header className="mb-6">
        <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">Panel</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Administración</h1>
        <p className="text-sm text-brand-midnight/60">Gestiona usuarios, roles y el catálogo de servicios.</p>
      </header>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="admin-tab-users">Usuarios</TabsTrigger>
          <TabsTrigger value="services" data-testid="admin-tab-services">Catálogo</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="services">
          <ServicesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-2xl border border-black/5 mt-4">
      <div className="p-4 flex justify-between items-center border-b border-black/5">
        <div className="font-semibold">Equipo Innovagraf</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="add-user-button">
              <Plus size={14} className="mr-1" /> Nuevo usuario
            </Button>
          </DialogTrigger>
          <CreateUserDialog onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left">
          <tr>
            <Th>Nombre</Th>
            <Th>Email</Th>
            <Th>Rol</Th>
            <Th>Activo</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-black/5" data-testid={`user-row-${u.id}`}>
              <td className="px-4 py-3 font-semibold">{u.name}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded-full bg-zinc-100 capitalize">{u.role}</span></td>
              <td className="px-4 py-3">
                <Switch checked={u.active} onCheckedChange={async (v) => { await api.patch(`/admin/users/${u.id}`, { active: v }); load(); }} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"
                  onClick={async () => {
                    if (!window.confirm(`¿Eliminar a ${u.name}?`)) return;
                    try {
                      await api.delete(`/admin/users/${u.id}`);
                      toast.success("Usuario eliminado");
                      load();
                    } catch (e) {
                      toast.error(e?.response?.data?.detail || "Error al eliminar");
                    }
                  }}
                  data-testid={`delete-user-${u.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateUserDialog({ onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", role: "comercial", password: "" });
  const [loading, setLoading] = useState(false);
  const save = async () => {
    if (!form.email || !form.name || form.password.length < 6) {
      toast.error("Completa todos los campos. Password mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/users", form);
      toast.success("Usuario creado");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };
  return (
    <DialogContent data-testid="create-user-dialog">
      <DialogHeader>
        <DialogTitle>Nuevo usuario</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name-input" /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email-input" /></div>
        <div>
          <Label>Rol</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Contraseña (mín. 6)</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" /></div>
      </div>
      <DialogFooter>
        <Button disabled={loading} onClick={save} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="save-user-button">Crear</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ServicesPanel() {
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get("/services");
    setServices(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-2xl border border-black/5 mt-4">
      <div className="p-4 flex justify-between items-center border-b border-black/5">
        <div className="font-semibold">Catálogo de servicios</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="add-service-button">
              <Plus size={14} className="mr-1" /> Nuevo servicio
            </Button>
          </DialogTrigger>
          <CreateServiceDialog onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left">
          <tr><Th>Servicio</Th><Th>Categoría</Th><Th>Precio base</Th><Th>Activo</Th><Th></Th></tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-black/5" data-testid={`service-row-${s.id}`}>
              <td className="px-4 py-3">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-brand-midnight/55">{s.description}</div>
              </td>
              <td className="px-4 py-3 capitalize">{s.category}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrency(s.base_price)}</td>
              <td className="px-4 py-3">
                <Switch checked={s.active} onCheckedChange={async (v) => { await api.patch(`/services/${s.id}`, { active: v }); load(); }} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"
                  onClick={async () => {
                    if (!window.confirm(`¿Eliminar ${s.name}?`)) return;
                    await api.delete(`/services/${s.id}`);
                    load();
                  }}
                  data-testid={`delete-service-${s.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateServiceDialog({ onSaved }) {
  const [form, setForm] = useState({ code: "", name: "", description: "", category: "web", base_price: 0, active: true });
  const save = async () => {
    if (!form.code || !form.name) {
      toast.error("Código y nombre son requeridos");
      return;
    }
    try {
      await api.post("/services", form);
      toast.success("Servicio creado");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error");
    }
  };
  return (
    <DialogContent data-testid="create-service-dialog">
      <DialogHeader><DialogTitle>Nuevo servicio</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        </div>
        <div><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="ai">IA</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Precio base USD</Label><Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} className="bg-brand-orange hover:bg-brand-orangeDark rounded-full" data-testid="save-service-button">Crear</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-brand-midnight/55">{children}</th>;
}
