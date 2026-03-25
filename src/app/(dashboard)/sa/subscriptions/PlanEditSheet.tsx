import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function PlanEditSheet({
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

    useEffect(() => {
        if (plan) {
            setFormData({ ...plan });
        }
    }, [plan]);

    if (!plan || !formData) return null;

    const isEnterprise = 'features' in formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name.includes("rice") || name === "requests" || name === "perUser" || name === "active" ? Number(value) : value,
        }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Edit {plan.name} Plan</SheetTitle>
                    <SheetDescription>Make changes to the subscription plan details and save.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-5 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Monthly Price ($)</Label>
                            <Input id="price" name="price" type="number" value={formData.price || 0} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="annualPrice">Annual Price ($/mo)</Label>
                            <Input id="annualPrice" name="annualPrice" type="number" value={formData.annualPrice || 0} onChange={handleChange} />
                        </div>
                    </div>

                    {isEnterprise ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="perUser">Per User Price ($)</Label>
                                <Input id="perUser" name="perUser" type="number" value={formData.perUser || 0} onChange={handleChange} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="popular"
                                    checked={formData.popular || false}
                                    onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, popular: checked === true }))}
                                />
                                <Label htmlFor="popular" className="font-medium cursor-pointer">Mark as Popular</Label>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="features">Features (Comma separated)</Label>
                                <Textarea
                                    id="features"
                                    name="features"
                                    rows={4}
                                    value={(formData.features || []).join(", ")}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, features: e.target.value.split(",").map(f => f.trim()) }))}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="requests">Monthly Requests</Label>
                                <Input id="requests" name="requests" type="number" value={formData.requests || 0} onChange={handleChange} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="popular"
                                    checked={formData.popular || false}
                                    onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, popular: checked === true }))}
                                />
                                <Label htmlFor="popular" className="font-medium cursor-pointer">Mark as Recommended</Label>
                            </div>
                        </>
                    )}
                </div>
                <SheetFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full">Cancel</Button>
                    <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
