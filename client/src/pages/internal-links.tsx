import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, Plus, Trash2, GripVertical, Edit2 } from "lucide-react";
import type { SiteUrl, LinkTableColumn } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function InternalLinks() {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [renameColumnOpen, setRenameColumnOpen] = useState(false);
  const [renamingColumn, setRenamingColumn] = useState<LinkTableColumn | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: columns = [], isLoading: columnsLoading } = useQuery<LinkTableColumn[]>({
    queryKey: ["/api/link-table-columns"],
  });

  const { data: rows = [], isLoading: rowsLoading } = useQuery<SiteUrl[]>({
    queryKey: ["/api/site-urls"],
  });

  const createColumnMutation = useMutation({
    mutationFn: (data: { name: string; order: number }) => 
      apiRequest("POST", "/api/link-table-columns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/link-table-columns"] });
      setAddColumnOpen(false);
      setNewColumnName("");
      toast({ title: "Column added" });
    },
    onError: () => {
      toast({ title: "Failed to add column", variant: "destructive" });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/link-table-columns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/link-table-columns"] });
      toast({ title: "Column deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete column", variant: "destructive" });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      apiRequest("PATCH", `/api/link-table-columns/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/link-table-columns"] });
      setRenameColumnOpen(false);
      setRenamingColumn(null);
      setRenameValue("");
      toast({ title: "Column renamed" });
    },
    onError: () => {
      toast({ title: "Failed to rename column", variant: "destructive" });
    },
  });

  const handleRenameColumn = (col: LinkTableColumn) => {
    setRenamingColumn(col);
    setRenameValue(col.name);
    setRenameColumnOpen(true);
  };

  const saveRenameColumn = () => {
    if (!renamingColumn || !renameValue.trim()) return;
    updateColumnMutation.mutate({ id: renamingColumn.id, name: renameValue.trim() });
  };

  const createRowMutation = useMutation({
    mutationFn: (data: { name: string; data: Record<string, string> }) => 
      apiRequest("POST", "/api/site-urls", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
    },
    onError: () => {
      toast({ title: "Failed to add row", variant: "destructive" });
    },
  });

  const updateRowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; data: Record<string, string> }> }) =>
      apiRequest("PATCH", `/api/site-urls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
    },
    onError: () => {
      toast({ title: "Failed to update cell", variant: "destructive" });
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/site-urls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
      toast({ title: "Row deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete row", variant: "destructive" });
    },
  });

  const startEditCell = (rowId: string, columnId: string, currentValue: string) => {
    setEditingCell({ rowId, columnId });
    setCellValue(currentValue);
  };

  const saveCell = () => {
    if (!editingCell) return;
    
    const row = rows.find(r => r.id === editingCell.rowId);
    if (!row) return;

    const newData = { ...(row.data || {}), [editingCell.columnId]: cellValue };
    updateRowMutation.mutate({ id: editingCell.rowId, data: { data: newData } });
    setEditingCell(null);
    setCellValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveCell();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const handleCellPaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    const hasMultipleCells = text.includes('\t') || text.split(/\r?\n/).filter(l => l.trim()).length > 1;
    if (!hasMultipleCells || !editingCell) return;

    e.preventDefault();
    cancelEdit();

    const lines = text.trim().split(/\r?\n/);
    const startRowIndex = rows.findIndex(r => r.id === editingCell.rowId);
    const startColIndex = columns.findIndex(c => c.id === editingCell.columnId);
    
    if (startRowIndex === -1 || startColIndex === -1) return;

    const updates: { rowId: string; colId: string; value: string }[] = [];
    const newRowsData: Record<string, string>[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const cells = lines[lineIdx].split('\t');
      const targetRowIdx = startRowIndex + lineIdx;
      
      if (targetRowIdx < rows.length) {
        for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
          const targetColIdx = startColIndex + cellIdx;
          if (targetColIdx < columns.length) {
            updates.push({
              rowId: rows[targetRowIdx].id,
              colId: columns[targetColIdx].id,
              value: cells[cellIdx]?.trim() || ""
            });
          }
        }
      } else {
        const rowData: Record<string, string> = {};
        for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
          const targetColIdx = startColIndex + cellIdx;
          if (targetColIdx < columns.length) {
            rowData[columns[targetColIdx].id] = cells[cellIdx]?.trim() || "";
          }
        }
        if (Object.values(rowData).some(v => v)) {
          newRowsData.push(rowData);
        }
      }
    }

    const rowUpdates: Record<string, Record<string, string>> = {};
    for (const upd of updates) {
      if (!rowUpdates[upd.rowId]) {
        const row = rows.find(r => r.id === upd.rowId);
        rowUpdates[upd.rowId] = { ...(row?.data as Record<string, string> || {}) };
      }
      rowUpdates[upd.rowId][upd.colId] = upd.value;
    }

    for (const [rowId, data] of Object.entries(rowUpdates)) {
      await apiRequest("PATCH", `/api/site-urls/${rowId}`, { data });
    }

    for (const rowData of newRowsData) {
      await apiRequest("POST", "/api/site-urls", { name: "", data: rowData });
    }

    queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
    const totalCells = updates.length + newRowsData.reduce((sum, r) => sum + Object.keys(r).length, 0);
    toast({ title: `Pasted ${totalCells} cell${totalCells !== 1 ? 's' : ''}` });
  };

  const addNewRow = () => {
    createRowMutation.mutate({ name: "", data: {} });
  };

  const addNewColumn = () => {
    if (!newColumnName.trim()) return;
    createColumnMutation.mutate({ name: newColumnName.trim(), order: columns.length });
  };

  const isLoading = columnsLoading || rowsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Internal Links</h1>
          <p className="text-muted-foreground">
            Dynamic table for managing site URLs. Add/remove columns as needed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Site URLs</CardTitle>
          </div>
          <CardDescription>
            Click any cell to edit. Paste from spreadsheets to fill multiple cells.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="bg-muted/50 border-b flex text-sm font-medium sticky top-0">
                  <div className="w-10 px-2 py-2 border-r flex items-center justify-center shrink-0">
                    <span className="text-muted-foreground">#</span>
                  </div>
                  {columns.map((col) => (
                    <div key={col.id} className="w-48 px-3 py-2 border-r flex items-center justify-between group shrink-0">
                      <span className="truncate">{col.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            data-testid={`button-col-menu-${col.id}`}
                          >
                            <GripVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => handleRenameColumn(col)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename Column
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteColumnMutation.mutate(col.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  <div className="w-32 px-3 py-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setAddColumnOpen(true)}
                      data-testid="button-add-column"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Column
                    </Button>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="px-3 py-8 text-center text-muted-foreground">Loading...</div>
                  ) : rows.length === 0 && columns.length === 0 ? (
                    <div className="px-3 py-12 text-center text-muted-foreground space-y-2">
                      <p>No data yet. Start by adding columns, then add rows.</p>
                    </div>
                  ) : (
                    <>
                      {rows.map((row, rowIndex) => (
                        <div key={row.id} className="flex border-b last:border-b-0 group/row" data-testid={`row-${row.id}`}>
                          <div className="w-10 px-2 py-2 border-r flex items-center justify-center text-sm text-muted-foreground shrink-0">
                            {rowIndex + 1}
                          </div>
                          {columns.map((col) => {
                            const value = (row.data as Record<string, string>)?.[col.id] || "";
                            const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                            
                            return (
                              <div key={col.id} className="w-48 border-r shrink-0">
                                {isEditing ? (
                                  <Input
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onBlur={saveCell}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handleCellPaste}
                                    className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                                    autoFocus
                                    data-testid={`input-cell-${row.id}-${col.id}`}
                                  />
                                ) : (
                                  <div
                                    className="px-3 py-2 h-10 truncate cursor-pointer hover:bg-muted/30 text-sm"
                                    onClick={() => startEditCell(row.id, col.id, value)}
                                    title={value}
                                  >
                                    {value || <span className="text-muted-foreground/50">-</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="w-32 flex items-center px-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRowMutation.mutate(row.id)}
                              className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                              data-testid={`button-delete-row-${row.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {rows.length} row{rows.length !== 1 ? "s" : ""}, {columns.length} column{columns.length !== 1 ? "s" : ""}
              </span>
              <Button variant="outline" size="sm" onClick={addNewRow} data-testid="button-add-row">
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Column</DialogTitle>
            <DialogDescription>Enter a name for the new column</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
              onKeyDown={(e) => e.key === "Enter" && addNewColumn()}
              autoFocus
              data-testid="input-new-column-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnOpen(false)}>Cancel</Button>
            <Button onClick={addNewColumn} disabled={!newColumnName.trim() || createColumnMutation.isPending} data-testid="button-create-column">
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameColumnOpen} onOpenChange={setRenameColumnOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogDescription>Enter a new name for "{renamingColumn?.name}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Column name"
              onKeyDown={(e) => e.key === "Enter" && saveRenameColumn()}
              autoFocus
              data-testid="input-rename-column"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameColumnOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveRenameColumn} 
              disabled={!renameValue.trim() || updateColumnMutation.isPending}
              data-testid="button-save-rename"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
