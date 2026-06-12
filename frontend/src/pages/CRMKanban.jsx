import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, formatCurrency } from "@/lib/constants";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function CRMKanban() {
  const [columns, setColumns] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leads/kanban");
      setColumns(data.columns);
      setStatuses(data.statuses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const sourceCol = [...(columns[source.droppableId] || [])];
    const [moved] = sourceCol.splice(source.index, 1);
    const destCol = [...(columns[destination.droppableId] || [])];
    moved.status = destination.droppableId;
    destCol.splice(destination.index, 0, moved);
    setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    try {
      await api.patch(`/leads/${draggableId}`, { status: destination.droppableId });
      toast.success(`Lead movido a "${STATUS_LABELS[destination.droppableId]}"`);
    } catch (e) {
      toast.error("Error al mover lead");
      load();
    }
  };

  return (
    <div className="p-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-brand-orange font-bold">CRM</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pipeline Comercial</h1>
          <p className="text-sm text-brand-midnight/60">Arrastra y suelta para cambiar el estado de cada lead.</p>
        </div>
      </header>

      {loading ? (
        <div className="text-sm text-brand-midnight/60">Cargando pipeline…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6" data-testid="kanban-board">
            {statuses.map((status) => {
              const items = columns[status] || [];
              const totalValue = items.reduce((s, l) => s + (l.estimated_value || 0), 0);
              return (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-shrink-0 w-72 rounded-2xl border bg-zinc-50 transition ${
                        snapshot.isDraggingOver ? "border-brand-orange bg-brand-orange/5" : "border-black/10"
                      }`}
                      data-testid={`kanban-col-${status}`}
                    >
                      <div className="p-3 border-b border-black/5">
                        <div className={`inline-flex items-center gap-2 text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                          <span className="bg-white px-1.5 rounded-full">{items.length}</span>
                        </div>
                        <div className="text-xs text-brand-midnight/55 mt-1.5">
                          {formatCurrency(totalValue)} en pipeline
                        </div>
                      </div>
                      <div className="p-3 space-y-2 min-h-[120px]">
                        {items.map((lead, idx) => (
                          <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                            {(p, snap) => (
                              <Link to={`/app/leads/${lead.id}`}>
                                <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  className={`bg-white rounded-xl border border-black/10 p-3 shadow-sm hover:border-brand-orange/40 hover:shadow-md transition ${
                                    snap.isDragging ? "rotate-1 shadow-lg" : ""
                                  }`}
                                  data-testid={`kanban-card-${lead.id}`}
                                >
                                  <div className="font-semibold text-sm truncate">{lead.company_name}</div>
                                  <div className="text-xs text-brand-midnight/60 truncate">{lead.contact_name}</div>
                                  <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="font-bold text-brand-orange">
                                      {formatCurrency(lead.estimated_value)}
                                    </span>
                                    {lead.maturity_score > 0 && (
                                      <span className="inline-flex items-center gap-1 text-brand-midnight/60">
                                        <Sparkles size={10} /> {lead.maturity_score}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {items.length === 0 && (
                          <div className="text-xs text-brand-midnight/40 text-center py-6">
                            Sin leads
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
