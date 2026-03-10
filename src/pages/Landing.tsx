import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
  CalendarCheck, Clock, Shield, Star, ArrowRight, CheckCircle2
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, brain: Brain,
  eye: Eye, baby: Baby, bone: Bone, "scan-face": ScanFace, smile: Smile,
};

const specializations = [
  { name: "General Medicine", icon: "stethoscope", color: "from-primary to-info" },
  { name: "Cardiology", icon: "heart-pulse", color: "from-destructive to-warning" },
  { name: "Dermatology", icon: "scan-face", color: "from-secondary to-success" },
  { name: "Orthopedics", icon: "bone", color: "from-warning to-destructive" },
  { name: "Pediatrics", icon: "baby", color: "from-info to-primary" },
  { name: "Neurology", icon: "brain", color: "from-accent-foreground to-primary" },
  { name: "Ophthalmology", icon: "eye", color: "from-secondary to-info" },
  { name: "Dentistry", icon: "smile", color: "from-success to-secondary" },
];

const steps = [
  { icon: ScanFace, title: "Choose a Specialist", desc: "Browse our expert doctors by specialty and find your perfect match." },
  { icon: CalendarCheck, title: "Book Your Slot", desc: "Pick a convenient date and time from real-time availability." },
  { icon: CheckCircle2, title: "Get Treated", desc: "Visit the clinic and receive world-class medical care." },
];

const stats = [
  { value: "15+", label: "Expert Doctors" },
  { value: "10k+", label: "Happy Patients" },
  { value: "8", label: "Specializations" },
  { value: "98%", label: "Satisfaction Rate" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">MediBook</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#specializations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Specializations</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full px-6 shadow-soft">
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                <Shield className="h-3.5 w-3.5" /> Trusted by 10,000+ Patients
              </span>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6"
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
            >
              Your Health,{" "}
              <span className="gradient-text">Our Priority</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10"
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
            >
              Book appointments with top specialists in seconds. Experience healthcare that's modern, seamless, and designed around you.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <Button size="lg" asChild className="rounded-full px-8 text-base h-12 shadow-elevated">
                <Link to="/auth?tab=signup">
                  Book an Appointment <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 text-base h-12">
                <a href="#specializations">Explore Specializations</a>
              </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
            initial="hidden" animate="visible"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass rounded-2xl p-5 text-center shadow-card"
                custom={i + 4} variants={fadeUp}
              >
                <div className="text-2xl md:text-3xl font-display font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" className="py-20 md:py-28">
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 className="text-3xl md:text-4xl font-display font-bold mb-4" custom={0} variants={fadeUp}>
              Our <span className="gradient-text">Specializations</span>
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-lg mx-auto" custom={1} variants={fadeUp}>
              Expert care across multiple medical disciplines, all under one roof.
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {specializations.map((spec, i) => {
              const Icon = iconMap[spec.icon] || Stethoscope;
              return (
                <motion.div
                  key={spec.name}
                  className="group glass rounded-2xl p-6 text-center shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                >
                  <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${spec.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-sm md:text-base">{spec.name}</h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28" style={{ background: "var(--gradient-hero)" }}>
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 className="text-3xl md:text-4xl font-display font-bold mb-4" custom={0} variants={fadeUp}>
              How It <span className="gradient-text">Works</span>
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-lg mx-auto" custom={1} variants={fadeUp}>
              Three simple steps to better health.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative glass rounded-3xl p-8 shadow-card text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              >
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg shadow-soft">
                  {i + 1}
                </div>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5">
                  <step.icon className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 className="text-3xl md:text-4xl font-display font-bold mb-4" custom={0} variants={fadeUp}>
              What Our <span className="gradient-text">Patients Say</span>
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Sarah M.", text: "Booking was incredibly easy. I found a cardiologist and had an appointment within 24 hours!", rating: 5 },
              { name: "James R.", text: "The doctors are top-notch. The whole experience from booking to consultation was seamless.", rating: 5 },
              { name: "Emily K.", text: "I love being able to upload my medical documents beforehand. It saves so much time at the clinic.", rating: 5 },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                className="glass rounded-2xl p-6 shadow-card"
                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <span className="font-medium text-sm">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <motion.div
            className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
            style={{ background: "var(--gradient-primary)" }}
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Ready to Take Control of Your Health?
              </h2>
              <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
                Join thousands of patients who trust MediBook for their healthcare needs.
              </p>
              <Button size="lg" variant="secondary" asChild className="rounded-full px-8 h-12 text-base">
                <Link to="/auth?tab=signup">
                  Create Your Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">MediBook</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 MediBook. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
