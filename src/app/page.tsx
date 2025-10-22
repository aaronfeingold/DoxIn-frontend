"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Zap,
  Shield,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function Page() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/doxin.png"
                  alt="DoxIn Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <span className="text-xl font-semibold">DoxIn</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-8">
              Turn piles of receipts into spending insights
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground text-balance mb-12 leading-relaxed">
              AI-powered extraction that saves hours of manual work. Process
              hundreds of invoices with industry-leading accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all group"
              >
                Start Processing Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold border border-border rounded-lg hover:bg-secondary transition-all"
              >
                See How It Works
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-24 max-w-5xl mx-auto"
          >
            <div className="border border-border rounded-2xl p-8 md:p-12 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Before */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <FileText className="h-4 w-4" />
                    <span>Before</span>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-6 border border-border min-h-[240px] flex items-center justify-center">
                    <Image
                      src="/unhappy.png"
                      alt="Before processing - unstructured invoice"
                      width={400}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>After AI Processing</span>
                  </div>
                  <div className="bg-secondary rounded-lg p-6 border border-border min-h-[240px] flex items-center justify-center">
                    <Image
                      src="/happy.png"
                      alt="After processing - structured data"
                      width={400}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-24 text-center"
          >
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-8">
              Trusted by modern teams
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 text-muted-foreground">
              <div className="text-lg font-medium">Acme Corp</div>
              <div className="text-lg font-medium">Nova Labs</div>
              <div className="text-lg font-medium">Pioneer</div>
              <div className="text-lg font-medium">Nimbus</div>
              <div className="text-lg font-medium">Volt</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 lg:px-8 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-6xl font-bold mb-4">98%</div>
              <div className="text-muted-foreground text-lg">
                Extraction Accuracy
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-6xl font-bold mb-4">10x</div>
              <div className="text-muted-foreground text-lg">
                Faster Than Manual
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-6xl font-bold mb-4">100%</div>
              <div className="text-muted-foreground text-lg">
                Data Validation
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Everything you need to automate invoice processing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Built for finance teams who demand accuracy and speed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Powered Extraction</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced GPT-4 Vision technology extracts invoice data with
                industry-leading accuracy, handling complex layouts and formats.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Process hundreds of invoices in minutes. Batch upload support
                and parallel processing ensure maximum throughput.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Validation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built-in validation rules ensure data accuracy and flag
                anomalies, reducing errors before they reach your system.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">Multiple Formats</h3>
              <p className="text-muted-foreground leading-relaxed">
                Support for PDF, PNG, JPG, and TIFF files with built-in OCR for
                scanned documents and images.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">Analytics Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track processing metrics, monitor accuracy, and gain insights
                into your invoice data with comprehensive analytics.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="border border-border rounded-xl p-8 hover:bg-card transition-colors"
            >
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-4">Easy Editing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Review and edit extracted data with an intuitive interface. Make
                corrections quickly before saving to your database.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-32 px-6 lg:px-8 border-t border-border"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Get started in three simple steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background rounded-full text-2xl font-bold mb-8">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Upload Documents</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Drag and drop your invoice files or select them from your
                computer. Supports single and batch uploads.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background rounded-full text-2xl font-bold mb-8">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Processing</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our advanced AI analyzes your documents, extracts all relevant
                data, and validates for accuracy.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background rounded-full text-2xl font-bold mb-8">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Review & Export</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Review the extracted data, make any needed edits, and export to
                your system or database.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Trusted by finance teams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border border-border rounded-xl p-8"
            >
              <p className="text-lg leading-relaxed mb-6">
                &ldquo;We cut manual entry by 90%. The validation rules caught
                issues before they hit our ERP.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-foreground" />
                <div>
                  <div className="text-sm font-semibold">Dana Kim</div>
                  <div className="text-xs text-muted-foreground">
                    Ops Lead, Acme Corp
                  </div>
                </div>
              </div>
            </motion.blockquote>
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="border border-border rounded-xl p-8"
            >
              <p className="text-lg leading-relaxed mb-6">
                &ldquo;Setup was painless. We processed thousands of invoices in
                our first week.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-foreground" />
                <div>
                  <div className="text-sm font-semibold">Miguel Alvarez</div>
                  <div className="text-xs text-muted-foreground">
                    Finance Director, Nova Labs
                  </div>
                </div>
              </div>
            </motion.blockquote>
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="border border-border rounded-xl p-8"
            >
              <p className="text-lg leading-relaxed mb-6">
                &ldquo;The accuracy is outstanding. Our audit trail improved
                without extra work.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-foreground" />
                <div>
                  <div className="text-sm font-semibold">Priya Shah</div>
                  <div className="text-xs text-muted-foreground">
                    Controller, Pioneer
                  </div>
                </div>
              </div>
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Ready to transform your invoice processing?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 text-balance">
              Join hundreds of businesses automating their invoice data
              extraction with AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border border-border rounded-lg hover:bg-secondary transition-all"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image
                    src="/doxin.png"
                    alt="DoxIn Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <span className="text-xl font-bold">DoxIn</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered invoice processing for modern businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/legal/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 DoxIn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
