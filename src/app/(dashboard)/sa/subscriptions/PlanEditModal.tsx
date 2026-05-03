import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_MODELS = [
    "GPT-4.1",
    "Claude Opus",
    "Claude Sonnet",
    "Claude Haiku",
    "Gemini 3.1 Flash",
    "Gemini 3.1 Flash Lite",
    "Gemini 2.5 Flash",
    "Gemini 2.5 Flash Lite",
];

export function PlanEditModal({
    plan,
    isOpen,
    onClose,
    onSave,
}: {
    plan: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedPlan: any) => void;
}) {
    const [formData, setFormData] = useState<any>(null);
    const [modelInput, setModelInput] = useState("");
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    useEffect(() => {
        if (plan) {
            setFormData({ ...plan });
        }
    }, [plan]);

    if (!plan || !formData) return null;

    const isEnterprise = 'perUser' in formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData((prev: any) => ({
            ...prev,
            [name]: name.includes("rice") || ["maxCost", "requests", "perUser", "active", "maxUploadSize", "contextWindow"].includes(name) ? Number(value) : value,
        }));
    };

    const filteredModels = AVAILABLE_MODELS.filter(m => m.toLowerCase().includes(modelInput.toLowerCase()) && !(formData?.allowedModels || []).includes(m));

    const addModel = (model: string) => {
        setFormData((prev: any) => ({
            ...prev,
            allowedModels: [...(prev.allowedModels || []), model]
        }));
        setModelInput("");
        setShowModelDropdown(false);
    }
    
    const removeAllowedModel = (model: string) => {
        setFormData((prev: any) => ({
            ...prev,
            allowedModels: (prev.allowedModels || []).filter((m: string) => m !== model)
        }));
    }

    const handleFeaturesChange = (index: number, value: string) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures[index] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const addFeature = () => {
        setFormData({ ...formData, features: [...(formData.features || []), ""] });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleExcludedChange = (index: number, value: string) => {
        const newExcluded = [...(formData.excluded || [])];
        newExcluded[index] = value;
        setFormData({ ...formData, excluded: newExcluded });
    };

    const addExcluded = () => {
        setFormData({ ...formData, excluded: [...(formData.excluded || []), ""] });
    };

    const removeExcluded = (index: number) => {
        const newExcluded = [...(formData.excluded || [])];
        newExcluded.splice(index, 1);
        setFormData({ ...formData, excluded: newExcluded });
    };

    const handleSave = () => {
        if (formData.features) {
            formData.features = formData.features.filter((f: string) => f.trim() !== "");
        }
        if (formData.excluded) {
            formData.excluded = formData.excluded.filter((f: string) => f.trim() !== "");
        }
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold">Edit {plan.name} Tier</DialogTitle>
                    <DialogDescription>
                        Modify pricing, limits, and configurations for this subscription tier. Changes will be reflected across the platform.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 pt-2 space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Plan Name</Label>
                                <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} className="h-11" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-sm font-semibold">Monthly Price ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                        <Input id="price" name="price" type="number" value={formData.price || 0} onChange={handleChange} className="pl-7 h-11" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="annualPrice" className="text-sm font-semibold">Annual Price ($/mo)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                        <Input id="annualPrice" name="annualPrice" type="number" value={formData.annualPrice || 0} onChange={handleChange} className="pl-7 h-11" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="maxCost" className="text-sm font-semibold">Estimated Max Cost ($)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                    <Input id="maxCost" name="maxCost" type="number" step="1" value={formData.maxCost || 0} onChange={handleChange} className="pl-7 h-11" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="maxUploadSize" className="text-sm font-semibold">Max Upload Size (MB)</Label>
                                    <Input id="maxUploadSize" name="maxUploadSize" type="number" value={formData.maxUploadSize || 0} onChange={handleChange} className="h-11" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contextWindow" className="text-sm font-semibold">Context Window Limit</Label>
                                    <Input id="contextWindow" name="contextWindow" type="number" value={formData.contextWindow || 0} onChange={handleChange} className="h-11" />
                                </div>
                            </div>

                            <div className="grid gap-2 pt-2 relative">
                                <Label htmlFor="allowedModels" className="text-sm font-semibold">Allowed AI Models</Label>
                                {formData.allowedModels && formData.allowedModels.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        {formData.allowedModels.map((m: string) => (
                                            <Badge key={m} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-xs">
                                                {m}
                                                <button type="button" onClick={() => removeAllowedModel(m)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <Input 
                                        value={modelInput} 
                                        onChange={(e) => {
                                            setModelInput(e.target.value);
                                            setShowModelDropdown(true);
                                        }} 
                                        onFocus={() => setShowModelDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                                        placeholder="Type to search and add AI Models..." 
                                        className="h-11" 
                                    />
                                    {showModelDropdown && filteredModels.length > 0 && (
                                        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                                            <div className="max-h-48 overflow-y-auto p-1">
                                                {filteredModels.map(m => (
                                                    <div 
                                                        key={m} 
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            addModel(m);
                                                        }}
                                                        className="relative flex select-none rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                    >
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6 space-y-4">
                            {isEnterprise ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="perUser" className="text-sm font-semibold">Base Price Per User ($)</Label>
                                            <Input id="perUser" name="perUser" type="number" value={formData.perUser || 0} onChange={handleChange} className="h-11" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/40 transition-colors hover:bg-muted/60">
                                        <Checkbox
                                            id="popular"
                                            checked={formData.popular || false}
                                            onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, popular: checked === true }))}
                                            className="h-5 w-5"
                                        />
                                        <div className="grid gap-1 leading-none">
                                            <Label htmlFor="popular" className="font-semibold cursor-pointer">Highlight as Popular</Label>
                                            <span className="text-xs text-muted-foreground">This plan will stand out with special styling on the pricing page.</span>
                                        </div>
                                    </div>

                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="requests" className="text-sm font-semibold">Monthly Query Limit</Label>
                                        <Input id="requests" name="requests" type="number" value={formData.requests || 0} onChange={handleChange} className="h-11" />
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/40 transition-colors hover:bg-muted/60">
                                        <Checkbox
                                            id="popular"
                                            checked={formData.popular || false}
                                            onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, popular: checked === true }))}
                                            className="h-5 w-5"
                                        />
                                        <div className="grid gap-1 leading-none">
                                            <Label htmlFor="popular" className="font-semibold cursor-pointer">Mark as Recommended</Label>
                                            <span className="text-xs text-muted-foreground">Highlights this plan as the best value for individuals.</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="border-t border-border pt-4 mt-6">
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Included Features</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="h-8 gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Add Feature
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {(formData.features || []).map((feature: string, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={feature}
                                                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                                                    placeholder="e.g. Advanced Analytics"
                                                    className="h-10"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                    onClick={() => removeFeature(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {(!formData.features || formData.features.length === 0) && (
                                            <div className="text-center p-4 border border-dashed rounded-lg text-sm text-muted-foreground">
                                                No features added. Click "Add Feature" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4">
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Excluded Features (Not included)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addExcluded} className="h-8 gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Add Excluded
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {(formData.excluded || []).map((feature: string, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={feature}
                                                    onChange={(e) => handleExcludedChange(index, e.target.value)}
                                                    placeholder="e.g. No API Access"
                                                    className="h-10"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                    onClick={() => removeExcluded(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {(!formData.excluded || formData.excluded.length === 0) && (
                                            <div className="text-center p-4 border border-dashed rounded-lg text-sm text-muted-foreground">
                                                No excluded features. Click "Add Excluded" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t bg-muted/20 sm:justify-between items-center flex-row">
                    <Button type="button" variant="ghost" onClick={onClose} className="px-6 text-muted-foreground">
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSave} className="px-8 font-semibold shadow-sm">
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
