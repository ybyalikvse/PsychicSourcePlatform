import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Settings, FileText, MessageSquare, Zap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { VspContentCategory as ContentCategory, VspContentSubtopic as ContentSubtopic, VspScriptStyle as ScriptStyle, VspCaptionStyle as CaptionStyle } from "@shared/schema";
import {
  insertVspContentCategorySchema as insertContentCategorySchema,
  insertVspContentSubtopicSchema as insertContentSubtopicSchema,
  insertVspScriptStyleSchema as insertScriptStyleSchema,
  insertVspCaptionStyleSchema as insertCaptionStyleSchema
} from "@shared/schema";
import type { z } from "zod";

type InsertContentCategory = z.infer<typeof insertContentCategorySchema>;
type InsertContentSubtopic = z.infer<typeof insertContentSubtopicSchema>;
type InsertScriptStyle = z.infer<typeof insertScriptStyleSchema>;
type InsertCaptionStyle = z.infer<typeof insertCaptionStyleSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");

  // Fetch data
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ContentCategory[]>({
    queryKey: ["/api/vsp/admin/content-categories"],
  });

  const { data: subtopics = [], isLoading: subtopicsLoading } = useQuery<ContentSubtopic[]>({
    queryKey: ["/api/vsp/admin/content-subtopics"],
  });

  const { data: scriptStyles = [], isLoading: scriptStylesLoading } = useQuery<ScriptStyle[]>({
    queryKey: ["/api/vsp/admin/script-styles"],
  });

  const { data: captionStyles = [], isLoading: captionStylesLoading } = useQuery<CaptionStyle[]>({
    queryKey: ["/api/vsp/admin/caption-styles"],
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Content Creator
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage content categories, subtopics, and AI generation styles</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Categories & Subtopics
          </TabsTrigger>
          <TabsTrigger value="script-styles" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Script Styles
          </TabsTrigger>
          <TabsTrigger value="caption-styles" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Caption Styles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesManager 
            categories={categories} 
            subtopics={subtopics}
            loading={categoriesLoading || subtopicsLoading}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="script-styles">
          <ScriptStylesManager 
            scriptStyles={scriptStyles} 
            loading={scriptStylesLoading}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="caption-styles">
          <CaptionStylesManager 
            captionStyles={captionStyles} 
            loading={captionStylesLoading}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Categories Manager Component with integrated Subtopics
function CategoriesManager({ categories, subtopics, loading, queryClient, toast }: {
  categories: ContentCategory[];
  subtopics: ContentSubtopic[];
  loading: boolean;
  queryClient: any;
  toast: any;
}) {
  const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<ContentSubtopic | null>(null);
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const form = useForm<InsertContentCategory>({
    resolver: zodResolver(insertContentCategorySchema),
    defaultValues: {
      name: "",
      icon: "",
      color: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const subtopicForm = useForm<InsertContentSubtopic>({
    resolver: zodResolver(insertContentSubtopicSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertContentCategory) => {
      return await apiRequest("POST", "/api/vsp/admin/content-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-categories"] });
      toast({ title: "Success", description: "Category created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentCategory> }) => {
      return await apiRequest("PUT", `/api/vsp/admin/content-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-categories"] });
      toast({ title: "Success", description: "Category updated successfully" });
      setEditingCategory(null);
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vsp/admin/content-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Subtopic mutations
  const createSubtopicMutation = useMutation({
    mutationFn: async (data: InsertContentSubtopic) => {
      return await apiRequest("POST", "/api/vsp/admin/content-subtopics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic created successfully" });
      setIsSubtopicDialogOpen(false);
      subtopicForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSubtopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentSubtopic> }) => {
      return await apiRequest("PUT", `/api/vsp/admin/content-subtopics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic updated successfully" });
      setEditingSubtopic(null);
      setIsSubtopicDialogOpen(false);
      subtopicForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubtopicMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vsp/admin/content-subtopics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertContentCategory) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onSubtopicSubmit = (data: InsertContentSubtopic) => {
    if (editingSubtopic) {
      updateSubtopicMutation.mutate({ id: editingSubtopic.id, data });
    } else {
      createSubtopicMutation.mutate(data);
    }
  };

  const openEditDialog = (category: ContentCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    form.reset({
      name: "",
      icon: "",
      color: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  // Subtopic helper functions
  const openSubtopicEditDialog = (subtopic: ContentSubtopic) => {
    setEditingSubtopic(subtopic);
    subtopicForm.reset({
      categoryId: subtopic.categoryId,
      name: subtopic.name,
      description: subtopic.description || "",
      isActive: subtopic.isActive,
      sortOrder: subtopic.sortOrder,
    });
    setIsSubtopicDialogOpen(true);
  };

  const openSubtopicCreateDialog = (categoryId: string) => {
    setEditingSubtopic(null);
    subtopicForm.reset({
      categoryId: categoryId,
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setIsSubtopicDialogOpen(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategorySubtopics = (categoryId: string) => {
    return subtopics.filter(s => s.categoryId === categoryId);
  };

  if (loading) {
    return <div>Loading categories...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Content Categories</CardTitle>
            <CardDescription>Manage your content categories that replace the static topics</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-category">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Update the category details" : "Add a new content category"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Technology" data-testid="input-category-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Font Awesome class)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., fa-laptop" data-testid="input-category-icon" />
                        </FormControl>
                        <FormDescription>Font Awesome icon class name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color (Tailwind class)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., bg-blue-500" data-testid="input-category-color" />
                        </FormControl>
                        <FormDescription>Tailwind CSS color class</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Describe this category..." data-testid="input-category-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-category-active" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || 0}
                              type="number" 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-category-sort-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-category"
                    >
                      {editingCategory ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Subtopic Dialog */}
          <Dialog open={isSubtopicDialogOpen} onOpenChange={setIsSubtopicDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSubtopic ? "Edit Subtopic" : "Create New Subtopic"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubtopic ? "Update the subtopic details" : "Add a new content subtopic"}
                </DialogDescription>
              </DialogHeader>
              <Form {...subtopicForm}>
                <form onSubmit={subtopicForm.handleSubmit(onSubtopicSubmit)} className="space-y-4">
                  <FormField
                    control={subtopicForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subtopic-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={subtopicForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., AI Development" data-testid="input-subtopic-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={subtopicForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Describe this subtopic..." data-testid="input-subtopic-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <FormField
                      control={subtopicForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-subtopic-active" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={subtopicForm.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || 0}
                              type="number" 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-subtopic-sort-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsSubtopicDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createSubtopicMutation.isPending || updateSubtopicMutation.isPending}
                      data-testid="button-save-subtopic"
                    >
                      {editingSubtopic ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const categorySubtopics = getCategorySubtopics(category.id);
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div 
                key={category.id} 
                className="border rounded-lg"
                data-testid={`card-category-${category.id}`}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="w-8 h-8 p-0"
                    >
                      {isExpanded ? "−" : "+"}
                    </Button>
                    <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center text-white`}>
                      <i className={category.icon}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold" data-testid={`text-category-name-${category.id}`}>
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-gray-500">Sort: {category.sortOrder}</span>
                        <span className="text-xs text-gray-500">
                          {categorySubtopics.length} subtopic{categorySubtopics.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSubtopicCreateDialog(category.id)}
                      data-testid={`button-add-subtopic-${category.id}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subtopic
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(category.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Subtopics (when expanded) */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="space-y-2">
                      {categorySubtopics.map((subtopic) => (
                        <div 
                          key={subtopic.id}
                          className="flex items-center justify-between p-3 bg-white border rounded"
                          data-testid={`card-subtopic-${subtopic.id}`}
                        >
                          <div>
                            <h4 className="font-medium" data-testid={`text-subtopic-name-${subtopic.id}`}>
                              {subtopic.name}
                            </h4>
                            <p className="text-sm text-gray-600">{subtopic.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={subtopic.isActive ? "default" : "secondary"} className="text-xs">
                                {subtopic.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-gray-500">Sort: {subtopic.sortOrder}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSubtopicEditDialog(subtopic)}
                              data-testid={`button-edit-subtopic-${subtopic.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSubtopicMutation.mutate(subtopic.id)}
                              disabled={deleteSubtopicMutation.isPending}
                              data-testid={`button-delete-subtopic-${subtopic.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {categorySubtopics.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No subtopics in this category yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found. Create your first category to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Subtopics Manager Component  
function SubtopicsManager({ subtopics, categories, loading, queryClient, toast }: {
  subtopics: ContentSubtopic[];
  categories: ContentCategory[];
  loading: boolean;
  queryClient: any;
  toast: any;
}) {
  const [editingSubtopic, setEditingSubtopic] = useState<ContentSubtopic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const form = useForm<InsertContentSubtopic>({
    resolver: zodResolver(insertContentSubtopicSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertContentSubtopic) => {
      return await apiRequest("POST", "/api/vsp/admin/content-subtopics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentSubtopic> }) => {
      return await apiRequest("PUT", `/api/vsp/admin/content-subtopics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic updated successfully" });
      setEditingSubtopic(null);
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vsp/admin/content-subtopics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/content-subtopics"] });
      toast({ title: "Success", description: "Subtopic deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertContentSubtopic) => {
    if (editingSubtopic) {
      updateMutation.mutate({ id: editingSubtopic.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (subtopic: ContentSubtopic) => {
    setEditingSubtopic(subtopic);
    form.reset({
      categoryId: subtopic.categoryId,
      name: subtopic.name,
      description: subtopic.description || "",
      isActive: subtopic.isActive,
      sortOrder: subtopic.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSubtopic(null);
    form.reset({
      categoryId: "",
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const filteredSubtopics = selectedCategory && selectedCategory !== "all"
    ? subtopics.filter(s => s.categoryId === selectedCategory)
    : subtopics;

  if (loading) {
    return <div>Loading subtopics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Content Subtopics</CardTitle>
            <CardDescription>Manage subtopics for each content category</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} data-testid="button-create-subtopic">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtopic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSubtopic ? "Edit Subtopic" : "Create New Subtopic"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSubtopic ? "Update the subtopic details" : "Add a new content subtopic"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subtopic-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., AI Development" data-testid="input-subtopic-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Describe this subtopic..." data-testid="input-subtopic-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormLabel>Active</FormLabel>
                            <FormControl>
                              <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-subtopic-active" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || 0}
                                type="number" 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-subtopic-sort-order"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-subtopic"
                      >
                        {editingSubtopic ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredSubtopics.map((subtopic) => (
            <div 
              key={subtopic.id} 
              className="flex items-center justify-between p-4 border rounded-lg"
              data-testid={`card-subtopic-${subtopic.id}`}
            >
              <div>
                <h3 className="font-semibold" data-testid={`text-subtopic-name-${subtopic.id}`}>
                  {subtopic.name}
                </h3>
                <p className="text-sm text-gray-600">{subtopic.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{getCategoryName(subtopic.categoryId)}</Badge>
                  <Badge variant={subtopic.isActive ? "default" : "secondary"}>
                    {subtopic.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-gray-500">Sort: {subtopic.sortOrder}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(subtopic)}
                  data-testid={`button-edit-subtopic-${subtopic.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(subtopic.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-subtopic-${subtopic.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {filteredSubtopics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {selectedCategory && selectedCategory !== "all"
                ? "No subtopics found for this category. Create your first subtopic." 
                : "No subtopics found. Create your first subtopic to get started."
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Script Styles Manager Component
function ScriptStylesManager({ scriptStyles, loading, queryClient, toast }: {
  scriptStyles: ScriptStyle[];
  loading: boolean;
  queryClient: any;
  toast: any;
}) {
  const [editingStyle, setEditingStyle] = useState<ScriptStyle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertScriptStyle>({
    resolver: zodResolver(insertScriptStyleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      promptTemplate: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertScriptStyle) => {
      return await apiRequest("POST", "/api/vsp/admin/script-styles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/script-styles"] });
      toast({ title: "Success", description: "Script style created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScriptStyle> }) => {
      return await apiRequest("PUT", `/api/vsp/admin/script-styles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/script-styles"] });
      toast({ title: "Success", description: "Script style updated successfully" });
      setEditingStyle(null);
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vsp/admin/script-styles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/script-styles"] });
      toast({ title: "Success", description: "Script style deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertScriptStyle) => {
    if (editingStyle) {
      updateMutation.mutate({ id: editingStyle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (style: ScriptStyle) => {
    setEditingStyle(style);
    form.reset({
      name: style.name,
      key: style.key,
      description: style.description || "",
      promptTemplate: style.promptTemplate,
      isActive: style.isActive,
      sortOrder: style.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStyle(null);
    form.reset({
      name: "",
      key: "",
      description: "",
      promptTemplate: "",
      isActive: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading script styles...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Script Styles</CardTitle>
            <CardDescription>Manage AI script generation styles and their prompt templates</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-script-style">
                <Plus className="w-4 h-4 mr-2" />
                Add Script Style
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStyle ? "Edit Script Style" : "Create New Script Style"}
                </DialogTitle>
                <DialogDescription>
                  {editingStyle ? "Update the script style and AI prompt template" : "Add a new script generation style with AI prompt"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Emotional Hook" data-testid="input-script-style-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key (Code)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., emotional-hook" data-testid="input-script-style-key" />
                          </FormControl>
                          <FormDescription>Unique identifier used in code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Describe this script style..." data-testid="input-script-style-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="promptTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Prompt Template</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Create a {duration} second TikTok script about {subtopic} in the {category} category..." 
                            rows={6}
                            data-testid="input-script-style-prompt"
                          />
                        </FormControl>
                        <FormDescription>
                          Use {"{subtopic}"} for subtopic description, {"{category}"} for category, and {"{duration}"} for video length
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-script-style-active" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || 0}
                              type="number" 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-script-style-sort-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-script-style"
                    >
                      {editingStyle ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scriptStyles.map((style) => (
            <div 
              key={style.id} 
              className="p-4 border rounded-lg"
              data-testid={`card-script-style-${style.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold" data-testid={`text-script-style-name-${style.id}`}>
                    {style.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{style.key}</Badge>
                    <Badge variant={style.isActive ? "default" : "secondary"}>
                      {style.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-gray-500">Sort: {style.sortOrder}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(style)}
                    data-testid={`button-edit-script-style-${style.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(style.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-script-style-${style.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {style.description && (
                <p className="text-sm text-gray-600 mb-3">{style.description}</p>
              )}
              
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-medium mb-2">AI Prompt Template:</h4>
                <p className="text-sm font-mono text-gray-700">{style.promptTemplate}</p>
              </div>
            </div>
          ))}
          
          {scriptStyles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No script styles found. Create your first script style to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Caption Styles Manager Component  
function CaptionStylesManager({ captionStyles, loading, queryClient, toast }: {
  captionStyles: CaptionStyle[];
  loading: boolean;
  queryClient: any;
  toast: any;
}) {
  const [editingStyle, setEditingStyle] = useState<CaptionStyle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertCaptionStyle>({
    resolver: zodResolver(insertCaptionStyleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      promptTemplate: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCaptionStyle) => {
      return await apiRequest("POST", "/api/vsp/admin/caption-styles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/caption-styles"] });
      toast({ title: "Success", description: "Caption style created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CaptionStyle> }) => {
      return await apiRequest("PUT", `/api/vsp/admin/caption-styles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/caption-styles"] });
      toast({ title: "Success", description: "Caption style updated successfully" });
      setEditingStyle(null);
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vsp/admin/caption-styles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/admin/caption-styles"] });
      toast({ title: "Success", description: "Caption style deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertCaptionStyle) => {
    if (editingStyle) {
      updateMutation.mutate({ id: editingStyle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (style: CaptionStyle) => {
    setEditingStyle(style);
    form.reset({
      name: style.name,
      key: style.key,
      description: style.description || "",
      promptTemplate: style.promptTemplate,
      isActive: style.isActive,
      sortOrder: style.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStyle(null);
    form.reset({
      name: "",
      key: "",
      description: "",
      promptTemplate: "",
      isActive: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading caption styles...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Caption Styles</CardTitle>
            <CardDescription>Manage AI caption generation styles and their prompt templates</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-caption-style">
                <Plus className="w-4 h-4 mr-2" />
                Add Caption Style
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStyle ? "Edit Caption Style" : "Create New Caption Style"}
                </DialogTitle>
                <DialogDescription>
                  {editingStyle ? "Update the caption style and AI prompt template" : "Add a new caption generation style with AI prompt"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Conversational" data-testid="input-caption-style-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key (Code)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., conversational" data-testid="input-caption-style-key" />
                          </FormControl>
                          <FormDescription>Unique identifier used in code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Describe this caption style..." data-testid="input-caption-style-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="promptTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Prompt Template</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Create an engaging TikTok caption for a video about {topic}. Include relevant hashtags..." 
                            rows={6}
                            data-testid="input-caption-style-prompt"
                          />
                        </FormControl>
                        <FormDescription>
                          Use {"{topic}"} for topic, {"{script}"} for script content, and other variables as needed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-caption-style-active" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || 0}
                              type="number" 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-caption-style-sort-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-caption-style"
                    >
                      {editingStyle ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {captionStyles.map((style) => (
            <div 
              key={style.id} 
              className="p-4 border rounded-lg"
              data-testid={`card-caption-style-${style.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold" data-testid={`text-caption-style-name-${style.id}`}>
                    {style.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{style.key}</Badge>
                    <Badge variant={style.isActive ? "default" : "secondary"}>
                      {style.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-gray-500">Sort: {style.sortOrder}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(style)}
                    data-testid={`button-edit-caption-style-${style.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(style.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-caption-style-${style.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {style.description && (
                <p className="text-sm text-gray-600 mb-3">{style.description}</p>
              )}
              
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-medium mb-2">AI Prompt Template:</h4>
                <p className="text-sm font-mono text-gray-700">{style.promptTemplate}</p>
              </div>
            </div>
          ))}
          
          {captionStyles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No caption styles found. Create your first caption style to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}