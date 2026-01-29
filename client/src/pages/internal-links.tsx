import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, Plus, Trash2, ClipboardPaste, Upload, GripVertical } from "lucide-react";
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
  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [addColumnOpen, setAddColumnOpen] = useState(false);

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

  const addNewRow = () => {
    createRowMutation.mutate({ name: "", data: {} });
  };

  const addNewColumn = () => {
    if (!newColumnName.trim()) return;
    createColumnMutation.mutate({ name: newColumnName.trim(), order: columns.length });
  };

  const parseClipboardData = (text: string): { columnNames: string[]; rows: Record<string, string>[] } => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return { columnNames: [], rows: [] };

    const firstLine = lines[0].split('\t');
    const columnNames = firstLine.map(name => name.trim()).filter(Boolean);
    
    const dataRows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split('\t');
      const rowData: Record<string, string> = {};
      columnNames.forEach((colName, idx) => {
        rowData[colName] = cells[idx]?.trim() || "";
      });
      if (Object.values(rowData).some(v => v)) {
        dataRows.push(rowData);
      }
    }
    
    return { columnNames, rows: dataRows };
  };

  const handleBulkImport = async () => {
    const { columnNames, rows: dataRows } = parseClipboardData(bulkData);
    
    if (columnNames.length === 0 || dataRows.length === 0) {
      toast({ title: "No valid data found", description: "First row should be column headers", variant: "destructive" });
      return;
    }

    setIsPasting(true);

    const existingColNames = columns.map(c => c.name.toLowerCase());
    const newCols = columnNames.filter(name => !existingColNames.includes(name.toLowerCase()));
    
    for (let i = 0; i < newCols.length; i++) {
      try {
        await apiRequest("POST", "/api/link-table-columns", { name: newCols[i], order: columns.length + i });
      } catch {
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["/api/link-table-columns"] });
    const updatedColumns = await queryClient.fetchQuery<LinkTableColumn[]>({ queryKey: ["/api/link-table-columns"] });

    const colNameToId: Record<string, string> = {};
    updatedColumns.forEach(col => {
      colNameToId[col.name.toLowerCase()] = col.id;
    });

    let successCount = 0;
    for (const rowData of dataRows) {
      const mappedData: Record<string, string> = {};
      Object.entries(rowData).forEach(([colName, value]) => {
        const colId = colNameToId[colName.toLowerCase()];
        if (colId) {
          mappedData[colId] = value;
        }
      });
      
      try {
        await apiRequest("POST", "/api/site-urls", { name: "", data: mappedData });
        successCount++;
      } catch {
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
    setIsPasting(false);
    setBulkPasteOpen(false);
    setBulkData("");
    toast({ title: `Imported ${successCount} row${successCount !== 1 ? 's' : ''}` });
  };

  const handleGlobalPaste = useCallback(async (e: ClipboardEvent) => {
    if (editingCell) return;
    
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    const text = e.clipboardData?.getData('text');
    if (!text) return;

    const lines = text.trim().split(/\r?\n/);
    if (lines.length > 1) {
      e.preventDefault();
      setBulkData(text);
      setBulkPasteOpen(true);
    }
  }, [editingCell]);

  useEffect(() => {
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [handleGlobalPaste]);

  const isLoading = columnsLoading || rowsLoading;
  const { columnNames: previewCols, rows: previewRows } = parseClipboardData(bulkData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Internal Links</h1>
          <p className="text-muted-foreground">
            Dynamic table for managing site URLs. Add/remove columns as needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkPasteOpen(true)} data-testid="button-bulk-paste">
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste from Sheet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Site URLs</CardTitle>
          </div>
          <CardDescription>
            Click any cell to edit. Paste from spreadsheets with column headers in the first row.
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
                      <p>No data yet. Start by adding columns or paste from a spreadsheet.</p>
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

      <Dialog open={bulkPasteOpen} onOpenChange={setBulkPasteOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Paste from Spreadsheet</DialogTitle>
            <DialogDescription>
              Paste data from Google Sheets or Excel. First row should contain column headers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder={"Column1\tColumn2\tColumn3\nValue1\tValue2\tValue3\nValue4\tValue5\tValue6"}
              className="min-h-[150px] font-mono text-sm"
              data-testid="textarea-bulk-paste"
            />
            
            {previewCols.length > 0 && previewRows.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-sm font-medium border-b">
                  Preview: {previewCols.length} columns, {previewRows.length} rows
                </div>
                <div className="max-h-[200px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        {previewCols.map((col, i) => (
                          <th key={i} className="px-3 py-1.5 text-left font-medium border-r last:border-r-0">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {previewCols.map((col, j) => (
                            <td key={j} className="px-3 py-1.5 truncate max-w-[150px] border-r last:border-r-0">{row[col] || "-"}</td>
                          ))}
                        </tr>
                      ))}
                      {previewRows.length > 5 && (
                        <tr>
                          <td colSpan={previewCols.length} className="px-3 py-1.5 text-center text-muted-foreground">
                            ... and {previewRows.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPasteOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleBulkImport}
              disabled={previewRows.length === 0 || isPasting}
              data-testid="button-import"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isPasting ? "Importing..." : `Import ${previewRows.length} rows`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
