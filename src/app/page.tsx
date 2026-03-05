"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Building2,
  User,
  Crown,
  Bot,
  FileText,
  BarChart3,
  Plug,
  ChevronRight,
  Menu,
  X,
  Check,
  ArrowRight,
  Lock,
  Sparkles,
  Eye,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, SUBSCRIPTION_PLANS } from "@/lib/constants";

/* ====== Animation Variants ====== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ====== Landing Page ====== */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/super-admin/login">
              <Button variant="ghost" size="sm">
                Admin
              </Button>
            </Link>
            <Link href="/auth/organization/login">
              <Button variant="ghost" size="sm">
                Organization
              </Button>
            </Link>
            <Link href="/auth/user/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/professional/register">
              <Button size="sm" className="bg-brand-700 hover:bg-brand-800">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-white px-4 pb-4 md:hidden"
          >
            <div className="flex flex-col gap-2 pt-3">
              <Link href="/auth/super-admin/login">
                <Button variant="ghost" className="w-full justify-start">
                  Admin Portal
                </Button>
              </Link>
              <Link href="/auth/organization/login">
                <Button variant="ghost" className="w-full justify-start">
                  Organization Portal
                </Button>
              </Link>
              <Link href="/auth/user/login">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/professional/register">
                <Button className="w-full bg-brand-700 hover:bg-brand-800">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
          <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-brand-50/60 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 border-brand-200 bg-brand-50 px-4 py-1.5 text-brand-700"
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Privacy-Preserving AI Gateway
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Use Commercial LLMs —{" "}
              <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                Without Exposing Your Data.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              D-SecureAI automatically detects and anonymizes sensitive
              information in your prompts before they reach any AI provider,
              then reconstructs the response seamlessly. Full AI productivity.
              Zero data exposure.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link href="/auth/professional/register">
                <Button
                  size="lg"
                  className="bg-brand-700 px-8 text-base hover:bg-brand-800"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#portals">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  For Organizations
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Pipeline visualization */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mx-auto mt-16 max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-danger/80" />
              <div className="h-3 w-3 rounded-full bg-warning/80" />
              <div className="h-3 w-3 rounded-full bg-success/80" />
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                D-SecureAI Privacy Pipeline
              </span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground">
                  &quot;Mr. <span className="rounded bg-danger/10 px-1 text-danger">Ahmed Khan</span> from{" "}
                  <span className="rounded bg-warning/10 px-1 text-warning">Samsung</span>{" "}
                  reviewed <span className="rounded bg-info/10 px-1 text-info">Project Enigma</span>&quot;
                </span>
              </div>
              <div className="flex items-center gap-3 text-brand-600">
                <Zap className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">
                  Detecting → Anonymizing → Sending to AI → Restoring
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-success">✓</span>
                <span className="text-foreground">
                  &quot;<span className="rounded bg-brand-50 px-1 text-brand-700">[PERSON_1]</span> from{" "}
                  <span className="rounded bg-brand-50 px-1 text-brand-700">[COMPANY_1]</span>{" "}
                  reviewed <span className="rounded bg-brand-50 px-1 text-brand-700">[PROJECT_1]</span>&quot;
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-border/50 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              How D-SecureAI Protects You
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-lg text-muted-foreground"
            >
              Three simple steps to safe AI usage
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {[
              {
                step: 1,
                icon: Eye,
                title: "You Type Your Query",
                description:
                  "Write your prompt normally — include names, company data, project details. D-SecureAI watches in real time.",
              },
              {
                step: 2,
                icon: ShieldCheck,
                title: "Detect & Anonymize",
                description:
                  "Sensitive entities like names, emails, project names and internal terms are replaced with intelligent pseudonyms.",
              },
              {
                step: 3,
                icon: Sparkles,
                title: "AI Responds Safely",
                description:
                  "The sanitized prompt goes to the AI. The response is reconstructed with your original data — the AI never saw it.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                custom={item.step}
                className="group relative rounded-2xl border border-border bg-background p-8 transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                    {item.step}
                  </span>
                  <item.icon className="h-6 w-6 text-brand-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="border-t border-border/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              Everything You Need for Secure AI Usage
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: ShieldCheck,
                title: "Context-Aware Anonymization",
                description:
                  "Replaces sensitive data with intelligent pseudonyms — not blank redactions — so AI responses stay accurate and relevant.",
              },
              {
                icon: Building2,
                title: "Enterprise Access Control",
                description:
                  "Manage departments, quotas, and employee access with full organizational hierarchy.",
              },
              {
                icon: Bot,
                title: "Multi-Provider Support",
                description:
                  "Switch between major LLMs like Claude, Gemini, GROK and more from a single interface.",
              },
              {
                icon: FileText,
                title: "File & Voice Input",
                description:
                  "Upload PDFs, Excel files, or use speech-to-text — all sanitized through the same privacy pipeline.",
              },
              {
                icon: BarChart3,
                title: "Full Visibility Dashboards",
                description:
                  "Every admin level gets analytics tailored to their scope — from platform-wide to per-employee.",
              },
              {
                icon: Plug,
                title: "Browser Extension",
                description:
                  "Apply D-SecureAI anonymization directly inside ChatGPT, Claude.ai, or Gemini without leaving those sites.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Portal Entry Section ── */}
      <section
        id="portals"
        className="border-t border-border/50 bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              Access Your Portal
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-lg text-muted-foreground"
            >
              D-SecureAI serves multiple user types. Select your category below.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mt-12 grid gap-6 lg:grid-cols-3"
          >
            {/* Super Admin Card */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="group relative overflow-hidden rounded-2xl bg-brand-950 p-8 text-white shadow-xl transition-all hover:shadow-2xl"
            >
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-white/5" />
              <Crown className="mb-4 h-10 w-10 text-brand-300" />
              <h3 className="text-2xl font-bold">Super Admin</h3>
              <p className="mt-3 leading-relaxed text-brand-200">
                Platform-level control. Manage all organizations, subscriptions,
                system settings, and platform-wide analytics.
              </p>
              <p className="mt-4 text-sm text-brand-300">
                Access is provisioned internally.
              </p>
              <Link href="/auth/super-admin/login" className="mt-6 block">
                <Button
                  variant="secondary"
                  className="w-full bg-white/10 text-white hover:bg-white/20"
                >
                  Sign In as Super Admin
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Organization Card */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="group relative overflow-hidden rounded-2xl border-l-4 border-l-brand-700 bg-brand-50/50 p-8 shadow-sm transition-all hover:shadow-md"
            >
              <Building2 className="mb-4 h-10 w-10 text-brand-700" />
              <h3 className="text-2xl font-bold text-foreground">
                Organization
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                For Organization Admins and Department Admins. Manage employees,
                departments, quotas, and enterprise context.
              </p>
              <p className="mt-2 text-sm font-medium text-brand-700">
                Covers: Org Admin · Dept Admin
              </p>
              <Link href="/auth/organization/login" className="mt-6 block">
                <Button className="w-full bg-brand-700 hover:bg-brand-800">
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  New organization?{" "}
                  <a
                    href="mailto:admin@dsecureai.com"
                    className="font-medium text-brand-600 hover:underline"
                  >
                    Contact us to get registered ↗
                  </a>
                </p>
              </div>
            </motion.div>

            {/* Professional & Employee Card */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="group relative overflow-hidden rounded-2xl border-l-4 border-l-brand-500 bg-brand-50/50 p-8 shadow-sm transition-all hover:shadow-md"
            >
              <User className="mb-4 h-10 w-10 text-brand-500" />
              <h3 className="text-2xl font-bold text-foreground">
                Professional & Employee
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                For standalone professionals and organization employees. Access
                the AI chat interface with full privacy protection.
              </p>
              <Link href="/auth/user/login" className="mt-6 block">
                <Button className="w-full bg-brand-600 hover:bg-brand-700">
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Independent professional?
                </p>
                <Link href="/auth/professional/register">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-brand-600 hover:text-brand-700"
                  >
                    Create Free Account →
                  </Button>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  Org employees: use Sign In with your invitation credentials.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Subscription Plans Preview ── */}
      <section className="border-t border-border/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold text-foreground sm:text-4xl"
            >
              Simple Plans for Every Professional
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-lg text-muted-foreground"
            >
              Start free. Upgrade when you need more.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mt-12 grid gap-6 lg:grid-cols-3"
          >
            {(
              Object.entries(SUBSCRIPTION_PLANS) as [
                string,
                (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS],
              ][]
            ).map(([key, plan], i) => (
              <motion.div
                key={key}
                variants={fadeUp}
                custom={i}
                className={`relative rounded-2xl border p-8 transition-all hover:shadow-md ${key === "PRO"
                    ? "border-brand-500 bg-white shadow-lg ring-1 ring-brand-500/20"
                    : "border-border bg-white"
                  }`}
              >
                {key === "PRO" && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-2xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/professional/register"
                  className="mt-8 block"
                >
                  <Button
                    variant={key === "PRO" ? "default" : "outline"}
                    className={`w-full ${key === "PRO"
                        ? "bg-brand-600 hover:bg-brand-700"
                        : ""
                      }`}
                  >
                    {key === "FREE" ? "Get Started" : `Start ${plan.name}`}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            For enterprise-scale access, your organization admin manages your
            plan.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">{APP_NAME}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  Secure AI. Seamlessly.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground">
                Contact
              </a>
              <a href="#" className="hover:text-foreground">
                Documentation
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} D-SecureAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
