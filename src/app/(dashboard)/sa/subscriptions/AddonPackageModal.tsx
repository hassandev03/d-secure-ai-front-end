import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SAAddonPackage } from "@/types/sa.types";

export function AddonPackageModal({
    addon,
    isOpen,
    onClose,
    onSave,
}: {
    addon: SAAddonPackage | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedAddon: SAAddonPackage) => void;
}) {
    const [formData, setFormData] = useState<Partial<SAAddonPackage>>({});

    useEffect(() => {
        if (addon) {
            setFormData({ ...addon });
        } else {
            // Default empty state for creating new package
            setFormData({
                id: `addon-${Date.now()}`,
                name: "",
                credits: 0,
                price: 0,
                cost: 0,
                popular: false,
                description: "",
            });
        }
    }, [addon, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "credits" || name === "price" || name === "cost" ? Number(value) : value,
        }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.credits || formData.price === undefined || formData.cost === undefined) {
            return; // Basic validation
        }
        onSave(formData as SAAddonPackage);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold">
                        {addon ? `Edit ${addon.name}` : "Create Add-on Package"}
                    </DialogTitle>
                    <DialogDescription>
                        {addon
                            ? "Modify pricing, credits, and details for this add-on package."
                            : "Create a new standardized add-on package for quota top-ups."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 pt-2 space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Package Name</Label>
                                <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} className="h-11" placeholder="e.g. Standard Top-up" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="credits" className="text-sm font-semibold">Credits Amount</Label>
                                    <Input id="credits" name="credits" type="number" min="0" value={formData.credits || 0} onChange={handleChange} className="h-11" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-sm font-semibold">Price ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                        <Input id="price" name="price" type="number" min="0" value={formData.price || 0} onChange={handleChange} className="pl-7 h-11" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cost" className="text-sm font-semibold">Estimated Cost ($)</Label>
                                <div className="relative max-w-[215px]">
                                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                                    <Input id="cost" name="cost" type="number" min="0" step="0.01" value={formData.cost || 0} onChange={handleChange} className="pl-7 h-11" />
                                </div>
                                <p className="text-xs text-muted-foreground">The platform cost for providing these credits.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                <Textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description || ""} 
                                    onChange={handleChange} 
                                    className="resize-none min-h-[80px]" 
                                    placeholder="Brief description of who this package is for..." 
                                />
                            </div>

                            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/40 transition-colors hover:bg-muted/60 mt-4">
                                <Checkbox
                                    id="popular"
                                    checked={formData.popular || false}
                                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, popular: checked === true }))}
                                    className="h-5 w-5"
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label htmlFor="popular" className="font-semibold cursor-pointer">Mark as Recommended</Label>
                                    <span className="text-xs text-muted-foreground">Highlights this add-on as popular or best value.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t bg-muted/20 sm:justify-between items-center flex-row">
                    <Button type="button" variant="ghost" onClick={onClose} className="px-6 text-muted-foreground">
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSave} className="px-8 font-semibold shadow-sm" disabled={!formData.name || !formData.credits}>
                        Save Package
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
