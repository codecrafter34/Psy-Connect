import Navigation from "@/components/Navigation";
import { Brain, Sparkles, Activity, ShieldCheck, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-calm">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6">About MindMirror</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Your Personal AI Companion for Mental Wellness
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            MindMirror is not just an emotion tracker. It's a highly intelligent, empathetic AI companion designed to understand how you feel and help you take the next best step for your mental health.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/50 border-y border-border/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A seamless integration of facial recognition and generative AI to provide a holistic wellness experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -translate-y-1/2 z-0" />
            
            <StepCard 
              number="01"
              title="Track"
              description="Using state-of-the-art AWS Rekognition and fallback ML models, we analyze your micro-expressions in real-time."
              icon={<Activity className="h-6 w-6 text-blue-500" />}
            />
            <StepCard 
              number="02"
              title="Analyze"
              description="We map your facial data to psychological states (like Stress, Anxiety, or Joy) to build your emotional profile."
              icon={<Brain className="h-6 w-6 text-purple-500" />}
            />
            <StepCard 
              number="03"
              title="Act"
              description="Our Gemini AI engine crafts highly personalized, actionable steps—from the perfect Spotify playlist to mindfulness tasks."
              icon={<Sparkles className="h-6 w-6 text-pink-500" />}
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-none shadow-xl">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <HeartPulse className="h-4 w-4" />
                  Our Mission
                </div>
                <h2 className="text-3xl font-bold">Making emotional intelligence accessible.</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In a fast-paced world, it's easy to lose touch with how we're really feeling. We built MindMirror to bridge the gap between technology and human emotion. By combining cutting-edge AI with empathetic design, we aim to help you understand yourself better and improve your emotional resilience every single day.
                </p>
              </div>
              <div className="flex-1">
                <div className="aspect-square rounded-2xl bg-gradient-hero opacity-90 p-1 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl" />
                  <ShieldCheck className="h-32 w-32 text-white relative z-10" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary ${className}`}>
    {children}
  </span>
);

const StepCard = ({ number, title, description, icon }) => (
  <Card className="p-8 relative z-10 bg-background/80 backdrop-blur-xl hover:-translate-y-2 transition-transform duration-300 shadow-lg border-primary/10">
    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-xl shadow-md">
      {number}
    </div>
    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </Card>
);

export default About;
