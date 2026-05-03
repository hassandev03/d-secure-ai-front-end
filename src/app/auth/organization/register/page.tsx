"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestOrganizationRegistration } from "@/services/auth.service";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Other"];
const ORG_SIZES = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"];

const schema = z.object({
  org_name: z.string().min(2, "Organization name is required"),
  org_industry: z.string().min(2, "Industry is required"),
  org_domain: z.string().url("Please enter a valid website URL"),
  org_country: z.string().min(1, "Please select a country"),
  org_size_range: z.string().min(1, "Please select an organization size"),
  admin_name: z.string().min(2, "Your name is required"),
  admin_email: z.string().email("Please enter a valid email address"),
  admin_phone: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function OrganizationRegistrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      await requestOrganizationRegistration(data);
      toast.success("Registration request sent!", {
        description: "Our team will get back to you within 24-48 hours.",
      });
      router.push("/");
    } catch (error) {
      toast.error("Failed to send request", {
        description: "An unexpected error occurred. Please try again later or contact us directly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Register Your Organization
                </h1>
                <p className="text-gray-500">
                  Join D-SecureAI and start protecting your data.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-0">
            <div className="space-y-8">
              {/* Organization Details */}
              <div className="space-y-4 rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-800">
                  Organization Details
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input id="org_name" {...register("org_name")} />
                    {errors.org_name && <p className="mt-1 text-sm text-red-600">{errors.org_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="org_industry">Industry</Label>
                    <Input id="org_industry" {...register("org_industry")} placeholder="e.g., Technology, Healthcare" />
                    {errors.org_industry && <p className="mt-1 text-sm text-red-600">{errors.org_industry.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="org_domain">Website</Label>
                    <Input id="org_domain" {...register("org_domain")} placeholder="https://example.com" />
                    {errors.org_domain && <p className="mt-1 text-sm text-red-600">{errors.org_domain.message}</p>}
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Select onValueChange={(value) => control.setValue("org_country", value)}>
                      <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.org_country && <p className="mt-1 text-sm text-red-600">{errors.org_country.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Organization Size</Label>
                    <Select onValueChange={(value) => control.setValue("org_size_range", value)}>
                      <SelectTrigger><SelectValue placeholder="Select a size" /></SelectTrigger>
                      <SelectContent>
                        {ORG_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.org_size_range && <p className="mt-1 text-sm text-red-600">{errors.org_size_range.message}</p>}
                  </div>
                </div>
              </div>

              {/* Your Details */}
              <div className="space-y-4 rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-800">
                  Your Details
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <Label htmlFor="admin_name">Your Full Name</Label>
                        <Input id="admin_name" {...register("admin_name")} />
                        {errors.admin_name && <p className="mt-1 text-sm text-red-600">{errors.admin_name.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="admin_email">Your Work Email</Label>
                        <Input id="admin_email" type="email" {...register("admin_email")} />
                        {errors.admin_email && <p className="mt-1 text-sm text-red-600">{errors.admin_email.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="admin_phone">Phone Number (Optional)</Label>
                        <Input id="admin_phone" {...register("admin_phone")} />
                    </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Anything else you'd like to share? (Optional)</Label>
                <Textarea id="message" {...register("message")} rows={4} placeholder="Tell us about your needs, specific PII concerns, or any questions you have." />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" className="w-full sm:w-auto bg-brand-700 hover:bg-brand-800" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Request
                </Button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
